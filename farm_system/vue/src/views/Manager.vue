<template>
  <div class="manager-shell">
    <NatureDynamicBackground theme="main" />
    <div class="topbar">
      <div class="brand-area">
        <div class="brand-mark">
          <img src="@/assets/imgs/logo.png" alt="">
        </div>
        <div>
          <div class="brand-name">农产品产销对接平台</div>
          <div class="brand-subtitle">供需发布 · 智能匹配 · 订单闭环</div>
        </div>
      </div>
      <div class="top-actions">
        <el-input
            v-model="data.searchKeyword"
            class="top-search"
            placeholder="搜索农产品名称"
            :prefix-icon="Search"
            @keyup.enter="handleTopSearch"
        >
          <template #append>
            <el-button @click="handleTopSearch">搜索</el-button>
          </template>
        </el-input>
        <div class="time-chip">
          <el-icon><Clock /></el-icon>
          <span>{{ data.todayText }}</span>
        </div>
        <div class="notice-chip clickable" @click="router.push('/messages')">
          <el-icon><Bell /></el-icon>
          <span>消息</span>
          <em v-if="data.messageCount > 0">{{ data.messageCount }}</em>
        </div>
        <el-popover
            v-model:visible="data.accountPanelVisible"
            placement="bottom-end"
            trigger="click"
            :width="380"
            popper-class="account-switch-popover">
          <template #reference>
            <div class="user-chip account-trigger" :class="{ active: data.accountPanelVisible }">
              <img :src="getAvatar(data.user)" alt="">
              <div class="user-chip-copy">
                <div class="user-name">{{ data.user.name }}</div>
                <div class="user-role">{{ getUserTypeText(data.user.userType || data.user.role) }}</div>
              </div>
              <el-icon class="account-arrow"><ArrowDown /></el-icon>
            </div>
          </template>

          <div class="account-panel">
            <div class="account-panel-head">
              <img :src="getAvatar(data.user)" alt="">
              <div>
                <div class="account-panel-name">{{ data.user.name || '未命名用户' }}</div>
                <div class="account-panel-role">{{ getUserTypeText(data.user.userType || data.user.role) }}</div>
              </div>
            </div>

            <div class="account-info-grid">
              <div>
                <span>账号</span>
                <strong>{{ data.user.username || '-' }}</strong>
              </div>
              <div>
                <span>电话</span>
                <strong>{{ data.user.phone || '未填写' }}</strong>
              </div>
              <div>
                <span>名称</span>
                <strong>{{ data.user.name || '-' }}</strong>
              </div>
              <div>
                <span>邮箱</span>
                <strong>{{ data.user.email || '未填写' }}</strong>
              </div>
            </div>

            <div class="account-section-title">已绑定账号</div>
            <div class="bound-account-list">
              <div
                  class="bound-account-item"
                  v-for="item in data.boundAccounts"
                  :key="getAccountKey(item)"
                  :class="{ current: isCurrentAccount(item) }">
                <img :src="getAvatar(item)" alt="">
                <div class="bound-account-main">
                  <strong>{{ item.name || item.username }}</strong>
                  <span>{{ item.username }} · {{ getUserTypeText(item.userType || item.role) }}</span>
                </div>
                <el-button
                    v-if="!isCurrentAccount(item)"
                    size="small"
                    type="primary"
                    link
                    @click.stop="switchAccount(item)">
                  切换
                </el-button>
                <el-tag v-else size="small" type="success">当前</el-tag>
                <el-button
                    v-if="!isCurrentAccount(item)"
                    size="small"
                    type="danger"
                    link
                    @click.stop="removeBoundAccount(item)">
                  移除
                </el-button>
              </div>
              <div v-if="data.boundAccounts.length === 0" class="bound-empty">暂无已绑定账号</div>
            </div>

            <div class="bind-account-box">
              <div class="bind-title">绑定并切换账号</div>
              <el-input v-model="data.bindForm.username" placeholder="输入账号" clearable />
              <el-input
                  v-model="data.bindForm.password"
                  placeholder="输入密码"
                  show-password
                  @keyup.enter="bindAccount" />
              <el-button :loading="data.bindLoading" type="primary" @click="bindAccount">验证并绑定</el-button>
            </div>
          </div>
        </el-popover>
      </div>
    </div>

    <div class="main-layout">
      <div class="sidebar">
        <el-menu
            router
            style="border: none"
            :default-active="router.currentRoute.value.path"
            :default-openeds="['1', '2']"
        >
          <el-menu-item index="/home">
            <el-icon><HomeFilled /></el-icon>
            <span>系统首页</span>
          </el-menu-item>
          <el-menu-item index="/matchRecord" v-if="data.user.userType === 'SUPPLIER' || data.user.userType === 'BUYER'">
            <el-icon><Connection /></el-icon>
            <span>我的对接记录</span>
          </el-menu-item>
          <el-menu-item index="/buy" v-if="data.user.role === 'ADMIN' || (data.user.role === 'USER' && data.user.userType !== 'SUPPLIER')">
            <el-icon><Goods /></el-icon>
            <span>农产品购买</span>
          </el-menu-item>
          <el-menu-item index="/supplyHall" v-if="data.user.userType === 'SUPPLIER' || data.user.userType === 'BUYER'">
            <el-icon><Sell /></el-icon>
            <span>{{ data.user.userType === 'SUPPLIER' ? '供应信息发布' : '供应信息大厅' }}</span>
          </el-menu-item>
          <el-sub-menu index="3" v-if="data.user.userType === 'SUPPLIER' || data.user.userType === 'BUYER'">
            <template #title>
              <el-icon><ShoppingCart /></el-icon>
              <span>供需对接中心</span>
            </template>
            <el-menu-item index="/matchRecommend">
              <el-icon><TrendCharts /></el-icon>
              <span>智能匹配推荐</span>
            </el-menu-item>
            <el-menu-item index="/demandHall">
              <el-icon><ShoppingCart /></el-icon>
              <span>{{ data.user.userType === 'BUYER' ? '发布采购意向' : '采购需求大厅' }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/matchAudit" v-if="data.user.role === 'ADMIN'">
            <el-icon><Checked /></el-icon>
            <span>供需审核管理</span>
          </el-menu-item>
          <el-menu-item index="/analysis" v-if="data.user.role === 'ADMIN'">
            <el-icon><TrendCharts /></el-icon>
            <span>数据分析看板</span>
          </el-menu-item>
          <el-sub-menu index="1" v-if="data.user.role === 'ADMIN'">
            <template #title>
              <el-icon><Menu /></el-icon>
              <span>农产品管理</span>
            </template>
            <el-menu-item index="/category">
              <el-icon><Menu /></el-icon>
              <span>农产品分类管理</span>
            </el-menu-item>
            <el-menu-item index="/goods">
              <el-icon><Goods /></el-icon>
              <span>农产品管理</span>
            </el-menu-item>
            <el-menu-item index="/goodsStock">
              <el-icon><SoldOut /></el-icon>
              <span>农产品进货管理</span>
            </el-menu-item>
            </el-sub-menu>
          <el-menu-item index="/notice" v-if="data.user.role === 'ADMIN'">
            <el-icon><Bell /></el-icon>
            <span>系统公告管理</span>
          </el-menu-item>
          <el-sub-menu index="2" v-if="data.user.role === 'ADMIN'">
            <template #title>
              <el-icon><Memo /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/admin">
              <el-icon><User /></el-icon>
              <span>管理员信息</span>
            </el-menu-item>
            <el-menu-item index="/user">
              <el-icon><User /></el-icon>
              <span>普通用户信息</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/orders" >
            <el-icon><Tickets /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/person">
            <el-icon><User /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
          <el-menu-item index="login" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出系统</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="content-area">
        <!-- 子页面统一通过这里切换，过渡动画集中写在主布局，避免每个业务页面重复维护。 -->
        <router-view v-slot="{ Component, route }">
          <transition name="page-switch" mode="out-in">
            <component
                :is="Component"
                :key="route.fullPath"
                class="route-page"
                @updateUser="updateUser" />
          </transition>
        </router-view>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive } from "vue";
import router from "@/router";
import {ElMessage, ElMessageBox} from "element-plus";
import {Search} from "@element-plus/icons-vue";
import request from "@/utils/request";
import NatureDynamicBackground from "@/components/NatureDynamicBackground.vue";

const ACCOUNT_STORE_KEY = 'bound-account-list'
const DEFAULT_AVATAR = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  todayText: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  messageCount: 0,
  searchKeyword: '',
  accountPanelVisible: false,
  boundAccounts: [],
  bindLoading: false,
  bindForm: {
    username: '',
    password: ''
  }
})

if (!data.user?.id) {
  ElMessage.error('请登录！')
  router.push('/login')
}

const updateUser = () => {
  data.user = JSON.parse(localStorage.getItem('system-user') || '{}')
  ensureCurrentAccountBound()
  loadMessageCount()
}

const getAvatar = (account) => {
  return account?.avatar || DEFAULT_AVATAR
}

const getUserTypeText = (value) => {
  const map = {
    ADMIN: '管理员',
    SUPPLIER: '供应商',
    BUYER: '采购商',
    SHOPPER: '日常购买'
  }
  return map[value] || '用户'
}

const getAccountKey = (account) => {
  return `${account?.role || 'USER'}-${account?.id || account?.username}`
}

const isCurrentAccount = (account) => {
  return getAccountKey(account) === getAccountKey(data.user)
}

const getStoredBoundAccounts = () => {
  return JSON.parse(localStorage.getItem(ACCOUNT_STORE_KEY) || '[]')
}

const saveBoundAccounts = (accounts) => {
  data.boundAccounts = accounts
  localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(accounts))
}

// 绑定账号只保存展示和切换所需的基础资料，不保存密码，避免本地缓存泄露账号凭据。
const normalizeAccountForBinding = (account) => {
  return {
    id: account.id,
    username: account.username,
    name: account.name,
    avatar: account.avatar,
    role: account.role,
    userType: account.userType,
    phone: account.phone,
    email: account.email,
    sex: account.sex
  }
}

const upsertBoundAccount = (account) => {
  const nextAccount = normalizeAccountForBinding(account)
  const nextKey = getAccountKey(nextAccount)
  const nextList = getStoredBoundAccounts().filter(item => getAccountKey(item) !== nextKey)
  nextList.unshift(nextAccount)
  saveBoundAccounts(nextList)
}

const ensureCurrentAccountBound = () => {
  if (data.user?.id) {
    upsertBoundAccount(data.user)
  } else {
    data.boundAccounts = getStoredBoundAccounts()
  }
}

// 账号绑定的判定条件：用输入的账号密码调用现有登录接口，校验成功才加入“已绑定账号”。
const loginForBinding = async (username, password) => {
  const roles = ['USER', 'ADMIN']
  for (const role of roles) {
    try {
      const res = await request.post('/login', { username, password, role })
      if (res.code === '200') {
        return res.data
      }
    } catch (e) {
      // 普通用户和管理员共用账号输入框：先试普通用户，再试管理员，失败时统一给出绑定失败提示。
    }
  }
  return null
}

const bindAccount = async () => {
  const username = (data.bindForm.username || '').trim()
  const password = data.bindForm.password || ''
  if (!username || !password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  data.bindLoading = true
  const account = await loginForBinding(username, password)
  data.bindLoading = false
  if (!account) {
    ElMessage.error('账号或密码错误，绑定失败')
    return
  }
  upsertBoundAccount(account)
  data.bindForm.username = ''
  data.bindForm.password = ''
  ElMessage.success(isCurrentAccount(account) ? '当前账号已在绑定列表中' : '绑定成功，可在列表中切换')
}

const switchAccount = (account) => {
  if (isCurrentAccount(account)) {
    ElMessage.info('当前已是该账号')
    return
  }
  localStorage.setItem('system-user', JSON.stringify(account))
  data.user = account
  data.accountPanelVisible = false
  ensureCurrentAccountBound()
  ElMessage.success('已切换为 ' + (account.name || account.username))
  setTimeout(() => window.location.reload(), 300)
}

const removeBoundAccount = (account) => {
  if (isCurrentAccount(account)) {
    ElMessage.warning('不能移除当前登录账号')
    return
  }
  ElMessageBox.confirm('确定从本机移除该绑定账号吗？不会删除系统账号。', '移除绑定', { type: 'warning' }).then(() => {
    saveBoundAccounts(getStoredBoundAccounts().filter(item => getAccountKey(item) !== getAccountKey(account)))
    ElMessage.success('已移除绑定账号')
  }).catch(() => {})
}

const logout = () => {
  ElMessage.success('退出成功')
  localStorage.removeItem('system-user')
  router.push('/login')
}

// 顶部搜索根据当前身份进入最常用的业务页面，带上关键词后由目标列表自动查询。
const handleTopSearch = () => {
  const keyword = (data.searchKeyword || '').trim()
  if (!keyword) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  let path = '/buy'
  if (data.user.role === 'ADMIN') {
    path = '/goods'
  } else if (data.user.userType === 'BUYER') {
    path = '/supplyHall'
  } else if (data.user.userType === 'SUPPLIER') {
    path = '/demandHall'
  }
  router.push({ path, query: { keyword } })
}

// 顶部消息数量来自真实订单和撮合记录状态，避免通知按钮只是装饰。
const loadMessageCount = () => {
  if (!data.user?.id) {
    return
  }
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
    const orders = orderRes.data || []
    const matches = matchRes.data || []
    const readKeys = getReadMessageKeys()
    const orderCount = orders.filter(item => {
      if (readKeys.includes('order-' + item.id)) {
        return false
      }
      if (data.user.role === 'ADMIN') {
        return item.status === '待发货' && !item.sourceSupplyId
      }
      if (data.user.userType === 'SUPPLIER') {
        return item.status === '待发货'
      }
      return item.status === '待支付' || item.status === '待收货'
    }).length
    const matchCount = matches.filter(item => {
      if (readKeys.includes('match-' + item.id)) {
        return false
      }
      return item.status === '待确认' || item.status === '已确认'
    }).length
    data.messageCount = Math.min(99, orderCount + matchCount)
  })
}

const getReadMessageKeys = () => {
  return JSON.parse(localStorage.getItem('read-message-keys-' + data.user.id) || '[]')
}

const handleMessageReadChange = () => loadMessageCount()

onMounted(() => {
  ensureCurrentAccountBound()
  window.addEventListener('message-read-change', handleMessageReadChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('message-read-change', handleMessageReadChange)
})

loadMessageCount()
</script>

<style scoped>
.manager-shell {
  min-height: 100vh;
  background: #163b22;
  /* 顶部栏改为固定悬浮后，外层需要预留高度，避免内容被悬浮层遮挡。 */
  padding: 104px 20px 20px;
  position: relative;
  overflow: auto;
}

.topbar {
  height: 70px;
  width: min(1520px, calc(100vw - 40px));
  margin: 0;
  background:
      radial-gradient(circle at 8% 0, rgba(87, 207, 58, .18), transparent 30%),
      linear-gradient(90deg, rgba(247, 255, 242, .92), rgba(241, 250, 237, .82) 46%, rgba(224, 244, 215, .78));
  backdrop-filter: blur(26px) saturate(1.18);
  -webkit-backdrop-filter: blur(26px) saturate(1.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, .9);
  border-radius: 20px;
  padding: 0 20px;
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  box-shadow:
      0 18px 42px rgba(10, 48, 20, .18),
      inset 0 1px 0 rgba(255, 255, 255, .78);
}
.topbar::after {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: -18px;
  height: 18px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(178, 215, 167, .34), rgba(178, 215, 167, 0));
  filter: blur(2px);
}
.brand-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(180deg, #f4fff0, #dff5d6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.8), 0 10px 20px rgba(28, 150, 18, .14);
}
.brand-mark img {
  width: 34px;
}
.brand-name {
  font-weight: 900;
  font-size: 23px;
  color: #176b24;
  line-height: 26px;
}
.brand-subtitle {
  color: #6b7a66;
  font-size: 12px;
  line-height: 18px;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.top-search {
  width: 330px;
}
.time-chip,
.notice-chip,
.user-chip {
  min-width: 140px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, .82);
  border: 1px solid rgba(226, 236, 223, .84);
  border-radius: 12px;
  padding: 8px 11px;
  box-shadow: 0 8px 18px rgba(39, 84, 52, .08);
}
.time-chip {
  min-width: auto;
  color: #263238;
}
.notice-chip {
  min-width: auto;
  position: relative;
}
.clickable {
  cursor: pointer;
}
.clickable:hover {
  border-color: #39b80e;
  box-shadow: 0 8px 18px rgba(28, 150, 18, .16);
}
.notice-chip em {
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #e54848;
  color: #fff;
  font-style: normal;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 4px rgba(229, 72, 72, .12);
}
.user-chip img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.account-trigger {
  min-width: 190px;
  cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}
.account-trigger:hover,
.account-trigger.active {
  border-color: rgba(47, 193, 10, .72);
  box-shadow: 0 12px 24px rgba(28, 150, 18, .18);
  transform: translateY(-1px);
}
.user-chip-copy {
  flex: 1;
  min-width: 0;
}
.user-name {
  color: #263238;
  font-weight: 700;
  line-height: 18px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.user-role {
  color: #6b7a66;
  font-size: 12px;
}
.account-arrow {
  color: #6b7a66;
  transition: transform .18s ease;
}
.account-trigger.active .account-arrow {
  transform: rotate(180deg);
}
.account-panel {
  color: #1f2d24;
  /* 账号切换面板内容较多，限制高度后在面板内部滚动，避免底部输入框被屏幕截断。 */
  max-height: min(620px, calc(100vh - 156px));
  overflow-y: auto;
  padding-right: 4px;
}
.account-panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background:
      radial-gradient(circle at 90% 10%, rgba(47, 193, 10, .2), transparent 32%),
      linear-gradient(135deg, #f8fff5 0%, #ecf8e7 100%);
  border: 1px solid rgba(222, 238, 216, .9);
}
.account-panel-head img,
.bound-account-item img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 18px rgba(39, 84, 52, .12);
}
.account-panel-name {
  max-width: 260px;
  color: #142116;
  font-size: 18px;
  font-weight: 900;
  line-height: 24px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.account-panel-role {
  display: inline-flex;
  margin-top: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  color: #148e07;
  background: rgba(47, 193, 10, .1);
  font-size: 12px;
}
.account-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 10px 0 12px;
}
.account-info-grid div {
  min-width: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f7faf5;
  border: 1px solid #edf3ea;
}
.account-info-grid span,
.account-info-grid strong {
  display: block;
}
.account-info-grid span {
  color: #7a8778;
  font-size: 12px;
  line-height: 16px;
}
.account-info-grid strong {
  margin-top: 4px;
  color: #263238;
  font-size: 13px;
  line-height: 18px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.account-section-title,
.bind-title {
  color: #263238;
  font-weight: 800;
  line-height: 22px;
}
.bound-account-list {
  display: grid;
  gap: 8px;
  max-height: 176px;
  overflow: auto;
  margin: 8px 0 14px;
  padding-right: 2px;
}
.bound-account-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 8px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #edf3ea;
}
.bound-account-item.current {
  background: linear-gradient(135deg, #f4fff0 0%, #edf9e8 100%);
  border-color: rgba(47, 193, 10, .42);
}
.bound-account-main {
  flex: 1;
  min-width: 0;
}
.bound-account-main strong,
.bound-account-main span {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.bound-account-main strong {
  color: #1f2d24;
  line-height: 20px;
}
.bound-account-main span {
  color: #7a8778;
  font-size: 12px;
  line-height: 18px;
}
.bound-empty {
  color: #8a9585;
  padding: 12px;
  border-radius: 10px;
  background: #f7faf5;
  text-align: center;
}
.bind-account-box {
  display: grid;
  gap: 9px;
  padding: 10px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfdf8 0%, #f3f8ef 100%);
  border: 1px solid #edf3ea;
}
:global(.account-switch-popover) {
  padding: 12px !important;
  border-radius: 16px !important;
  border: 1px solid rgba(221, 235, 216, .96) !important;
  box-shadow: 0 24px 58px rgba(13, 48, 24, .22) !important;
  max-height: calc(100vh - 126px) !important;
  overflow: hidden !important;
}
:global(.account-switch-popover .account-panel::-webkit-scrollbar),
:global(.account-switch-popover .bound-account-list::-webkit-scrollbar) {
  width: 6px;
}
:global(.account-switch-popover .account-panel::-webkit-scrollbar-thumb),
:global(.account-switch-popover .bound-account-list::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  background: rgba(63, 139, 55, .28);
}
:global(.account-switch-popover .account-panel::-webkit-scrollbar-track),
:global(.account-switch-popover .bound-account-list::-webkit-scrollbar-track) {
  background: transparent;
}
.main-layout {
  display: flex;
  width: min(1520px, calc(100vw - 40px));
  margin: 0 auto;
  background: rgba(255, 255, 255, .78);
  backdrop-filter: blur(18px) saturate(1.08);
  border: 1px solid rgba(255, 255, 255, .84);
  border-radius: 18px;
  box-shadow: 0 30px 76px rgba(13, 48, 24, .3);
  min-height: calc(100vh - 124px);
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.sidebar {
  width: 230px;
  border-right: 1px solid #edf2ea;
  min-height: calc(100vh - 124px);
  background:
      linear-gradient(180deg, rgba(255,255,255,.86), rgba(248,252,246,.74));
}
.content-area {
  flex: 1;
  width: 0;
  min-height: calc(100vh - 124px);
  position: relative;
  perspective: 1400px;
  background:
      radial-gradient(circle at 98% 0, rgba(58, 196, 12, .08), transparent 26%),
      linear-gradient(180deg, rgba(247, 250, 245, .86), rgba(240, 248, 236, .82));
  padding: 20px;
  overflow: auto;
}
.route-page {
  min-height: 100%;
  transform-origin: 50% 22px;
}

/* 页面切换采用轻量位移、透明度和柔焦，形成高级感但不干扰表格、表单和弹窗操作。 */
.page-switch-enter-active,
.page-switch-leave-active {
  transition:
      opacity .24s ease,
      transform .32s cubic-bezier(.2, .72, .18, 1),
      filter .28s ease;
  will-change: opacity, transform, filter;
}
.page-switch-enter-from {
  opacity: 0;
  transform: translate3d(18px, 14px, 0) scale(.985);
  filter: blur(7px);
}
.page-switch-leave-to {
  opacity: 0;
  transform: translate3d(-12px, -6px, 0) scale(.992);
  filter: blur(4px);
}
.page-switch-enter-to,
.page-switch-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: blur(0);
}
:global(.page-switch-enter-active .card),
:global(.page-switch-enter-active .summary-card),
:global(.page-switch-enter-active .goods-card),
:global(.page-switch-enter-active .page-title-panel) {
  animation: routeContentRise .38s cubic-bezier(.2, .72, .18, 1) both;
}
:global(.page-switch-enter-active .card:nth-of-type(2)),
:global(.page-switch-enter-active .summary-card:nth-child(2)) {
  animation-delay: .04s;
}
:global(.page-switch-enter-active .card:nth-of-type(3)),
:global(.page-switch-enter-active .summary-card:nth-child(3)) {
  animation-delay: .08s;
}
@keyframes routeContentRise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.el-menu {
  padding: 14px 12px;
  background: transparent;
}
.el-menu-item,
:deep(.el-sub-menu__title) {
  height: 48px;
  margin: 4px 0;
  border-radius: 12px;
  color: #2d392e;
}
.el-menu-item.is-active {
  background: linear-gradient(180deg, #2fc10a 0%, #158f08 100%) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 14px 24px rgba(28, 150, 18, .24);
}
.el-menu-item:hover {
  color: #176b24;
  background: #f2f8ef;
}
:deep(.el-sub-menu__title:hover) {
  color: #176b24;
  background: #f5faf2;
}
:deep(th)  {
  color: #333;
}
@media (max-width: 1180px) {
  .manager-shell {
    padding-top: 168px;
  }
  .topbar {
    height: auto;
    gap: 14px;
    flex-wrap: wrap;
    padding: 14px;
  }
  .top-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .top-search {
    flex: 1;
    min-width: 260px;
  }
}
</style>
