<template>
  <div>
    <div class="card page-title-panel">
      <div>
        <div class="page-title">消息中心</div>
        <div class="page-subtitle">根据订单状态和供需撮合记录自动生成待办提醒</div>
      </div>
      <div class="page-title-icon"><el-icon><Bell /></el-icon></div>
    </div>

    <div class="message-layout">
      <div class="message-main card">
        <div class="message-toolbar">
          <el-radio-group v-model="data.activeType">
            <el-radio-button label="全部" />
            <el-radio-button label="订单提醒" />
            <el-radio-button label="对接提醒" />
          </el-radio-group>
          <el-button type="primary" @click="load">刷新</el-button>
        </div>

        <div class="message-list">
          <div class="message-item" :class="{ read: isRead(item.key) }" v-for="item in filteredMessages" :key="item.key">
            <div class="message-icon" :class="item.level">
              <el-icon v-if="item.type === '订单提醒'"><Tickets /></el-icon>
              <el-icon v-else><Connection /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-title">{{ item.title }}</div>
              <div class="message-desc">{{ item.desc }}</div>
              <div class="message-meta">{{ item.type }} · {{ item.time || '刚刚' }}</div>
            </div>
            <el-tag :type="item.level === 'urgent' ? 'danger' : item.level === 'success' ? 'success' : 'warning'">
              {{ isRead(item.key) ? '已读' : item.status }}
            </el-tag>
            <el-button v-if="!isRead(item.key)" class="message-read-button" @click="markRead(item.key)">已查看</el-button>
          </div>
          <div v-if="filteredMessages.length === 0" class="empty-message">暂无需要处理的消息</div>
        </div>
      </div>

      <div class="message-side">
        <div class="side-card green">
          <div class="side-title">待办概览</div>
          <div class="side-number">{{ unreadMessages.length }}</div>
          <div class="side-text">未查看消息数量</div>
        </div>
        <div class="side-card">
          <div class="side-title">已读消息</div>
          <div class="side-number dark">{{ readMessages.length }}</div>
          <div class="side-text">点击“已查看”后会进入已读</div>
        </div>
        <div class="side-card">
          <div class="side-title">消息类型</div>
          <div class="side-line"><span></span> 采购需求满足提醒</div>
          <div class="side-line"><span></span> 供应商发货提醒</div>
          <div class="side-line"><span></span> 用户支付/收货提醒</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, reactive} from "vue";
import request from "@/utils/request";

const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  activeType: '全部',
  messages: [],
  readKeys: []
})

const filteredMessages = computed(() => {
  if (data.activeType === '全部') {
    return data.messages
  }
  return data.messages.filter(item => item.type === data.activeType)
})

const unreadMessages = computed(() => filteredMessages.value.filter(item => !isRead(item.key)))
const readMessages = computed(() => filteredMessages.value.filter(item => isRead(item.key)))

const load = () => {
  const orderParams = {}
  const matchParams = {}
  if (data.user.role !== 'ADMIN') {
    if (data.user.userType === 'SUPPLIER') {
      orderParams.supplierId = data.user.id
    } else {
      orderParams.userId = data.user.id
    }
    matchParams.relatedUserId = data.user.id
  }

  Promise.all([
    request.get('/orders/selectAll', { params: orderParams }),
    request.get('/matchRecord/selectAll', { params: matchParams })
  ]).then(([orderRes, matchRes]) => {
    data.readKeys = getStoredReadKeys()
    const orderMessages = buildOrderMessages(orderRes.data || [])
    const matchMessages = buildMatchMessages(matchRes.data || [])
    data.messages = [...orderMessages, ...matchMessages]
  })
}

const buildOrderMessages = (orders) => {
  return orders.map(item => {
    // 消息只提醒当前登录身份需要处理的订单动作：
    // 管理员只处理平台自营订单发货；直供商品由供应商发货；待支付/待收货只属于下单用户。
    if (data.user.role === 'ADMIN') {
      if (item.status === '待发货' && !item.sourceSupplyId) {
        return createOrderMessage(item, '平台订单等待发货', '该平台订单已支付，请管理员及时安排发货。', 'warning')
      }
      return null
    }
    if (data.user.userType === 'SUPPLIER') {
      if (item.status === '待发货') {
        return createOrderMessage(item, '直供订单等待发货', '采购方已完成支付，请及时处理直供订单发货。', 'warning')
      }
      return null
    }
    if (item.status === '待支付') {
      return createOrderMessage(item, '请完成订单支付', '你的农产品购买订单正在等待支付，支付后供应方或管理员会安排发货。', 'urgent')
    }
    if (item.status === '待发货') {
      return createOrderMessage(item, '订单已支付，等待发货', '该订单已进入发货流程，请等待供货方或管理员发货。', 'warning')
    }
    if (item.status === '待收货') {
      return createOrderMessage(item, '订单已发货，请确认收货', '农产品已经发货，到货后请及时确认收货。', 'warning')
    }
    if (item.status === '已完成') {
      return createOrderMessage(item, '订单已完成', '该农产品订单已经完成交易闭环。', 'success')
    }
    return null
  }).filter(Boolean)
}

const createOrderMessage = (item, title, desc, level) => ({
  key: 'order-' + item.id,
  type: '订单提醒',
  title,
  desc: `${desc} 订单号：${item.orderNo || '-'}，农产品：${item.goodsName || '未命名农产品'}。`,
  status: item.status,
  time: item.time,
  level
})

const buildMatchMessages = (matches) => {
  return matches.map(item => {
    if (item.status === '待确认') {
      return createMatchMessage(item, '有新的供需对接待确认', '双方已发起对接意向，请尽快确认或拒绝。', 'warning')
    }
    if (item.status === '已确认') {
      const title = data.user.userType === 'SUPPLIER' ? '采购方需求已确认，请准备发货' : '你的采购需求已获得供应响应'
      return createMatchMessage(item, title, '撮合已经确认，可以继续推进线下付款、发货或后续订单流程。', 'success')
    }
    return null
  }).filter(Boolean)
}

const createMatchMessage = (item, title, desc, level) => ({
  key: 'match-' + item.id,
  type: '对接提醒',
  title,
  desc: `${desc} 农产品：${item.productName || '未命名农产品'}，数量：${item.quantity || 0}${item.unit || ''}。`,
  status: item.status,
  time: item.createTime,
  level
})

const getStoredReadKeys = () => {
  return JSON.parse(localStorage.getItem('read-message-keys-' + data.user.id) || '[]')
}

const saveReadKeys = () => {
  localStorage.setItem('read-message-keys-' + data.user.id, JSON.stringify(data.readKeys))
  window.dispatchEvent(new Event('message-read-change'))
}

const isRead = (key) => data.readKeys.includes(key)

const markRead = (key) => {
  if (!data.readKeys.includes(key)) {
    data.readKeys.push(key)
    saveReadKeys()
  }
}

data.readKeys = getStoredReadKeys()
load()
</script>

<style scoped>
.message-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
}
.message-main {
  padding: 0;
  overflow: hidden;
}
.message-toolbar {
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid #edf2ea;
}
.message-list {
  padding: 10px 18px 18px;
}
.message-item {
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #edf2ea;
}
.message-item:last-child {
  border-bottom: none;
}
.message-item.read {
  opacity: .62;
}
/* 消息确认按钮使用独立样式，避免继承全局 primary 按钮后出现蓝底低对比度文字。 */
.message-read-button {
  min-width: 84px;
  color: #fff !important;
  font-weight: 700;
  border: none !important;
  background: linear-gradient(180deg, #2fc10a 0%, #158f08 100%) !important;
  box-shadow: 0 10px 20px rgba(28, 150, 18, .18);
}
.message-read-button:hover,
.message-read-button:focus {
  color: #fff !important;
  background: linear-gradient(180deg, #37cb12 0%, #18980a 100%) !important;
  box-shadow: 0 12px 24px rgba(28, 150, 18, .26);
}
.message-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #e6a23c;
  flex: 0 0 auto;
}
.message-icon.success {
  background: #1b9406;
}
.message-icon.urgent {
  background: #e54848;
}
.message-content {
  flex: 1;
  min-width: 0;
}
.message-title {
  font-size: 16px;
  font-weight: 800;
  color: #1f2d24;
}
.message-desc {
  color: #5f6d5e;
  line-height: 24px;
  margin-top: 4px;
}
.message-meta {
  color: #9aa59a;
  font-size: 12px;
  margin-top: 4px;
}
.empty-message {
  padding: 46px 0;
  text-align: center;
  color: #8b9689;
}
.message-side {
  display: grid;
  gap: 16px;
  align-content: start;
}
.side-card {
  border-radius: 16px;
  padding: 22px;
  background: rgba(255,255,255,.92);
}
.side-card.green {
  color: #fff;
  background: linear-gradient(180deg, #42c20b 0%, #188c05 100%);
}
.side-title {
  font-size: 20px;
  font-weight: 800;
}
.side-number {
  font-size: 52px;
  line-height: 70px;
}
.side-number.dark {
  color: #1f2d24;
}
.side-text {
  opacity: .78;
}
.side-line {
  height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5f6d5e;
  border-bottom: 1px solid #edf2ea;
}
.side-line span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #39b80e;
}
</style>
