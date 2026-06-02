<template>
  <div>

    <div class="overview-grid">
      <div class="market-visual">
        <div class="visual-head">
          <div>
            <div class="hero-title">产销对接态势</div>
            <div class="hero-desc">供应发布、采购意向、撮合记录和订单闭环集中呈现</div>
          </div>
          <div class="hero-badge switchable" @click="cycleUserType">{{ getUserTypeText(data.user.userType || data.user.role) }}</div>
        </div>
        <div class="field-stage">
          <div class="field-layer layer-1"></div>
          <div class="field-layer layer-2"></div>
          <div class="field-layer layer-3"></div>
          <div class="route-line"></div>
          <div class="node supplier-node switchable" @click="switchUserType('SUPPLIER')">供应</div>
          <div class="node match-node switchable" @click="switchUserType('SHOPPER')">撮合</div>
          <div class="node buyer-node switchable" @click="switchUserType('BUYER')">采购</div>
        </div>
        <div class="stage-cards">
          <div class="stage-card active">
            <span>供应匹配率</span>
            <strong>{{ getMatchRate() }}%</strong>
            <small>基于已确认撮合</small>
          </div>
          <div class="stage-card">
            <span>流转订单</span>
            <strong>{{ data.stats.orders }}</strong>
            <small>商城订单 + 对接订单</small>
          </div>
          <div class="stage-card">
            <span>待处理</span>
            <strong>{{ data.stats.demand }}</strong>
            <small>采购需求池</small>
          </div>
        </div>
      </div>

      <div class="right-rail">
        <div class="alert-card">
          <div class="rail-title">系统公告</div>
          <div class="notice-list">
            <div class="notice-item" v-for="item in latestNoticeList" :key="item.id">
              <span class="notice-dot"></span>
              <span class="notice-text">{{ item.title }}：{{ item.content }}</span>
            </div>
            <div v-if="latestNoticeList.length === 0" class="notice-empty">暂无公告</div>
          </div>
        </div>

        <div class="activity-card">
          <div class="rail-title">{{ flowProfile.title }}</div>
          <div class="rail-subtitle">{{ flowProfile.subtitle }}</div>
          <div class="flow-row" v-for="item in flowProfile.steps" :key="item"><span></span>{{ item }}</div>
        </div>
      </div>
    </div>
    <el-row :gutter="10" style="margin-bottom: 20px">
      <el-col :span="6">
        <div class="card stat-card supply">
          <div class="stat-icon"><el-icon><Sell /></el-icon></div>
          <div>
            <div class="stat-title">供应信息</div>
            <div class="stat-value">{{ data.stats.supply }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card stat-card demand">
          <div class="stat-icon"><el-icon><ShoppingCart /></el-icon></div>
          <div>
            <div class="stat-title">采购需求</div>
            <div class="stat-value">{{ data.stats.demand }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card stat-card match">
          <div class="stat-icon"><el-icon><Connection /></el-icon></div>
          <div>
            <div class="stat-title">撮合记录</div>
            <div class="stat-value">{{ data.stats.match }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card stat-card order">
          <div class="stat-icon"><el-icon><Tickets /></el-icon></div>
          <div>
            <div class="stat-title">订单数量</div>
            <div class="stat-value">{{ data.stats.orders }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="card user-ai-card" v-if="data.user.role === 'USER'">
      <div class="user-ai-main">
        <div class="user-ai-orb">
          <span>AI</span>
          <strong>{{ userAiProfile.metric }}</strong>
          <em>{{ userAiProfile.metricLabel }}</em>
        </div>
        <div class="user-ai-copy">
          <div class="user-ai-kicker">{{ userAiProfile.kicker }}</div>
          <div class="user-ai-title">{{ userAiProfile.title }}</div>
          <div class="user-ai-desc">{{ userAiProfile.desc }}</div>
        </div>
      </div>
      <div class="user-ai-side">
        <div class="user-ai-report">
          <div class="user-ai-report-head">
            <span>身份专属分析</span>
            <el-button size="small" type="success" @click="generateUserAiReport">刷新建议</el-button>
          </div>
          <div class="user-ai-lines">
            <p v-for="item in userAiReportList" :key="item">{{ item }}</p>
          </div>
          <div class="user-ai-time">分析时间：{{ data.userAiTime || '等待刷新' }}</div>
        </div>
        <div class="user-ai-actions">
          <el-button v-for="item in userAiActions" :key="item.label" @click="goAiAction(item.path)">
            {{ item.label }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="card recommend-card" v-if="data.user.userType === 'SUPPLIER' || data.user.userType === 'BUYER'">
      <div class="section-head">
        <div>
          <div class="section-title">智能匹配推荐</div>
          <div class="section-subtitle">根据农产品名称、价格、时间、地区和数量综合排序</div>
        </div>
      </div>
      <div class="recommend-list">
        <div class="recommend-item" v-for="item in data.recommendList" :key="item.supplyId + '-' + item.demandId">
          <el-progress type="circle" :width="62" :percentage="item.score" />
          <div class="recommend-info">
            <div class="recommend-title">{{ item.productName }}</div>
            <div class="recommend-line">数量：{{ item.quantity }}{{ item.unit }}</div>
            <div class="recommend-line">供应价：￥{{ item.supplyPrice }}</div>
          </div>
          <el-tag type="success">{{ item.reason }}</el-tag>
        </div>
        <div v-if="data.recommendList.length === 0" style="color: #888; padding: 20px 0;">暂无推荐</div>
      </div>
    </div>

    <div class="analytics-grid">
      <div class="card analytics-card province-panel">
        <div class="section-head compact">
          <div>
            <div class="section-title">产地分布</div>
            <div class="section-subtitle">按供应信息中的省份统计，体现农产品来源结构</div>
          </div>
        </div>
        <div class="origin-board">
          <div class="origin-core">
            <span>产地</span>
            <strong>{{ provinceRank.length }}</strong>
            <small>覆盖省份</small>
          </div>
          <div class="origin-ring ring-a"></div>
          <div class="origin-ring ring-b"></div>
        </div>
        <div class="rank-list">
          <div class="rank-row" v-for="item in provinceRank" :key="item.name">
            <div class="rank-name">{{ item.name }}</div>
            <div class="rank-track">
              <span :style="{ width: item.percent + '%' }"></span>
            </div>
            <div class="rank-value">{{ item.count }}</div>
          </div>
          <div v-if="provinceRank.length === 0" class="empty-tip">暂无产地数据</div>
        </div>
      </div>

      <div class="card analytics-card category-panel">
        <div class="section-head compact">
          <div>
            <div class="section-title">品类供需对比</div>
            <div class="section-subtitle">绿色代表供应发布，黄色代表采购需求</div>
          </div>
        </div>
        <div class="balance-list">
          <div class="balance-row" v-for="item in categoryBalance" :key="item.name">
            <div class="balance-name">{{ item.name }}</div>
            <div class="balance-bars">
              <div class="balance-line supply-line">
                <span :style="{ width: item.supplyPercent + '%' }"></span>
              </div>
              <div class="balance-line demand-line">
                <span :style="{ width: item.demandPercent + '%' }"></span>
              </div>
            </div>
            <div class="balance-num">{{ item.supply }}/{{ item.demand }}</div>
          </div>
          <div v-if="categoryBalance.length === 0" class="empty-tip">暂无品类数据</div>
        </div>
      </div>

      <div class="card analytics-card funnel-panel">
        <div class="section-head compact">
          <div>
            <div class="section-title">撮合转化漏斗</div>
            <div class="section-subtitle">从供需发布到确认撮合，再进入订单闭环</div>
          </div>
        </div>
        <div class="funnel-list">
          <div class="funnel-step" v-for="item in matchFunnel" :key="item.label">
            <div class="funnel-label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="funnel-bar" :style="{ width: item.percent + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="card analytics-card status-panel">
        <div class="section-head compact">
          <div>
            <div class="section-title">订单状态结构</div>
            <div class="section-subtitle">观察待支付、待发货、已完成等订单流转情况</div>
          </div>
        </div>
        <div class="status-grid">
          <div class="status-item" v-for="item in orderStatusList" :key="item.name">
            <div class="status-circle" :style="{ '--percent': item.percent + '%', '--color': item.color }">
              <span>{{ item.percent }}%</span>
            </div>
            <div class="status-name">{{ item.name }}</div>
            <div class="status-count">{{ item.count }} 单</div>
          </div>
          <div v-if="orderStatusList.length === 0" class="empty-tip">暂无订单数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from "vue";
import request from "@/utils/request";
import {ElMessage} from "element-plus";
import router from "@/router";

const emit = defineEmits(['updateUser'])

const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  noticeList: [],
  recommendList: [],
  supplyList: [],
  demandList: [],
  matchList: [],
  orderList: [],
  goodsList: [],
  userAiTime: '',
  stats: {
    supply: 0,
    demand: 0,
    match: 0,
    orders: 0,
    goodsOrders: 0,
    matchOrders: 0
  }
})

// 首页公告采用紧凑信息条，只展示最近三条，避免时间线占用过多首屏空间。
const latestNoticeList = computed(() => {
  return (data.noticeList || []).slice(0, 3)
})

const getPercent = (value, max) => {
  if (!max || !value) {
    return 0
  }
  return Math.max(6, Math.round((value / max) * 100))
}

const getCurrentTimeText = () => {
  return new Date().toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const generateUserAiReport = () => {
  data.userAiTime = getCurrentTimeText()
  ElMessage.success('已刷新你的身份专属分析')
}

const goAiAction = (path) => {
  router.push(path)
}

// 产地分布用于第 5 阶段可视化：直接复用供应信息的 originProvince 字段。
const provinceRank = computed(() => {
  const map = {}
  data.supplyList.forEach(item => {
    const name = item.originProvince || '未填写'
    map[name] = (map[name] || 0) + 1
  })
  const rows = Object.keys(map).map(name => ({ name, count: map[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  const max = Math.max(...rows.map(item => item.count), 0)
  return rows.map(item => ({ ...item, percent: getPercent(item.count, max) }))
})

// 品类供需对比帮助答辩时说明平台不是单纯商城，而是在观察供需是否均衡。
const categoryBalance = computed(() => {
  const map = {}
  data.supplyList.forEach(item => {
    const name = item.categoryName || '未分类'
    map[name] = map[name] || { name, supply: 0, demand: 0 }
    map[name].supply += 1
  })
  data.demandList.forEach(item => {
    const name = item.categoryName || '未分类'
    map[name] = map[name] || { name, supply: 0, demand: 0 }
    map[name].demand += 1
  })
  const rows = Object.values(map)
      .sort((a, b) => (b.supply + b.demand) - (a.supply + a.demand))
      .slice(0, 6)
  const max = Math.max(...rows.map(item => Math.max(item.supply, item.demand)), 0)
  return rows.map(item => ({
    ...item,
    supplyPercent: getPercent(item.supply, max),
    demandPercent: getPercent(item.demand, max)
  }))
})

const matchFunnel = computed(() => {
  const publishCount = data.supplyList.length + data.demandList.length
  const matchCount = data.matchList.length
  const confirmedCount = data.matchList.filter(item => item.status === '已确认').length
  const orderCount = data.stats.orders
  const base = Math.max(publishCount, 1)
  return [
    { label: '供需发布', value: publishCount, percent: 100 },
    { label: '发起意向', value: matchCount, percent: getPercent(matchCount, base) },
    { label: '确认撮合', value: confirmedCount, percent: getPercent(confirmedCount, base) },
    { label: '订单闭环', value: orderCount, percent: getPercent(orderCount, base) }
  ]
})

const orderStatusList = computed(() => {
  const colorMap = {
    '待支付': '#e6a23c',
    '待发货': '#2878ff',
    '待收货': '#36a3ff',
    '已完成': '#25b70a',
    '已取消': '#e54848'
  }
  const map = {}
  data.orderList.forEach(item => {
    const name = item.status || '未知'
    map[name] = (map[name] || 0) + 1
  })
  const total = data.orderList.length || 0
  return Object.keys(map).map(name => ({
    name,
    count: map[name],
    percent: total ? Math.round((map[name] / total) * 100) : 0,
    color: colorMap[name] || '#6b7a66'
  })).sort((a, b) => b.count - a.count)
})

// 首页右侧流程根据身份切换：日常购买突出商城购买闭环，其余角色突出产销对接主线。
const flowProfile = computed(() => {
  if (data.user.role === 'USER' && data.user.userType === 'SHOPPER') {
    return {
      title: '日常农产品购买流程',
      subtitle: '从挑选农产品到收货完成，突出普通用户的购买路径',
      steps: ['浏览农产品购买页', '选择商品并提交订单', '完成支付等待发货', '确认收货形成订单闭环']
    }
  }
  return {
    title: '产销对接流程',
    subtitle: '围绕供应发布、采购意向、智能匹配和订单闭环展开',
    steps: ['发布供应或采购意向', '系统进行智能匹配', '双方确认对接意向', '形成订单闭环']
  }
})

const availableGoodsCount = computed(() => {
  return data.goodsList.filter(item => Number(item.store || 0) > 0).length
})

const lowStockGoods = computed(() => {
  return data.goodsList
      .filter(item => Number(item.store || 0) <= 100)
      .sort((a, b) => Number(a.store || 0) - Number(b.store || 0))[0]
})

const bestRecommend = computed(() => {
  return [...data.recommendList].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0]
})

const pendingMatchCount = computed(() => {
  return data.matchList.filter(item => item.status === '待确认').length
})

const pendingOrderCount = computed(() => {
  return data.orderList.filter(item => item.status === '待支付' || item.status === '待发货' || item.status === '待收货').length
})

// 普通用户侧先用本地规则生成“AI 助手”建议，保证没有外部 AI Key 时也能稳定演示。
const userAiProfile = computed(() => {
  if (data.user.userType === 'SUPPLIER') {
    return {
      kicker: 'Supplier Copilot',
      title: '供应商 AI 对接助手',
      desc: '根据你的供应信息、全平台采购需求和撮合状态，提示优先响应的需求方向。',
      metric: bestRecommend.value?.score || pendingMatchCount.value || 0,
      metricLabel: bestRecommend.value ? '最高匹配' : '待确认'
    }
  }
  if (data.user.userType === 'BUYER') {
    return {
      kicker: 'Buyer Copilot',
      title: '采购商 AI 寻源助手',
      desc: '根据你的采购意向、平台供应货源和报价区间，辅助判断更适合发起意向的货源。',
      metric: bestRecommend.value?.score || data.stats.supply || 0,
      metricLabel: bestRecommend.value ? '最高匹配' : '可选货源'
    }
  }
  return {
    kicker: 'Shopping Copilot',
    title: '日常购买 AI 助手',
    desc: '根据商城库存和你的订单状态，提示可购买商品与需要处理的订单。',
    metric: availableGoodsCount.value,
    metricLabel: '可购商品'
  }
})

const userAiReportList = computed(() => {
  if (data.user.userType === 'SUPPLIER') {
    return [
      bestRecommend.value ? '当前最值得关注的采购需求是 ' + bestRecommend.value.productName + '，匹配度 ' + bestRecommend.value.score + '%，可优先进入对接确认。' : '当前暂无高匹配推荐，可以先补充供应信息的产地、上市时间和联系方式，提高被推荐概率。',
      '你当前可观察到 ' + data.stats.demand + ' 条采购需求，其中待确认撮合 ' + pendingMatchCount.value + ' 条，建议优先处理临近截止时间的需求。',
      data.stats.supply > 0 ? '你的供应信息已有 ' + data.stats.supply + ' 条，注意保持剩余库存与商城上架库存一致。' : '你还没有发布供应信息，建议先发布主打农产品，平台才能进行智能撮合。'
    ]
  }
  if (data.user.userType === 'BUYER') {
    return [
      bestRecommend.value ? '当前推荐优先对接 ' + bestRecommend.value.productName + '，供应价约 ￥' + bestRecommend.value.supplyPrice + '，匹配度 ' + bestRecommend.value.score + '%。' : '当前暂无精准供应推荐，可以补充采购需求的数量、收货地区和期望价格。',
      '你已发布 ' + data.stats.demand + ' 条采购意向，平台可见供应信息 ' + data.stats.supply + ' 条，可从供应信息大厅发起采购意向。',
      pendingMatchCount.value > 0 ? '你有 ' + pendingMatchCount.value + ' 条待确认对接记录，建议及时确认，避免供应库存被其他采购方占用。' : '暂无待确认对接记录，可以继续通过智能匹配寻找合适货源。'
    ]
  }
  return [
    '商城当前有 ' + availableGoodsCount.value + ' 个可购买农产品，单次购买斤类商品最多 100 斤，适合日常小额采购。',
    pendingOrderCount.value > 0 ? '你有 ' + pendingOrderCount.value + ' 个订单需要继续处理，可进入订单管理完成支付、收货或查看状态。' : '当前没有待处理订单，可以直接进入农产品购买页面挑选商品。',
    lowStockGoods.value ? lowStockGoods.value.name + ' 库存偏低，仅剩 ' + lowStockGoods.value.store + lowStockGoods.value.unit + '，需要时建议优先购买。' : '当前商品库存整体较稳定，暂无明显低库存提醒。'
  ]
})

const userAiActions = computed(() => {
  if (data.user.userType === 'SUPPLIER') {
    return [
      { label: '查看采购需求', path: '/demandHall' },
      { label: '处理对接记录', path: '/matchRecord' }
    ]
  }
  if (data.user.userType === 'BUYER') {
    return [
      { label: '查看供应货源', path: '/supplyHall' },
      { label: '发布采购意向', path: '/demandHall' }
    ]
  }
  return [
    { label: '去购买农产品', path: '/buy' },
    { label: '查看我的订单', path: '/orders' }
  ]
})

const getUserTypeText = (value) => {
  const map = {
    ADMIN: '管理员',
    SUPPLIER: '供应商',
    BUYER: '采购商',
    SHOPPER: '日常购买'
  }
  return map[value] || '用户'
}

const refreshOrderStat = () => {
  data.stats.orders = data.stats.goodsOrders + data.stats.matchOrders
}

const getMatchRate = () => {
  const total = data.stats.supply + data.stats.demand
  if (!total) {
    return 0
  }
  return Math.min(99, Math.round((data.stats.match / total) * 100))
}

// 首页态势图上的身份节点可直接切换普通用户身份，让页面更有交互感，也方便测试不同角色菜单。
const switchUserType = (type) => {
  if (data.user.role !== 'USER') {
    ElMessage.warning('管理员不需要切换普通用户身份')
    return
  }
  if (data.user.userType === type) {
    ElMessage.info('当前已经是' + getUserTypeText(type))
    return
  }
  const form = JSON.parse(JSON.stringify(data.user))
  form.userType = type
  request.put('/user/update', form).then(res => {
    if (res.code === '200') {
      data.user.userType = type
      localStorage.setItem('system-user', JSON.stringify(data.user))
      emit('updateUser')
      ElMessage.success('已切换为' + getUserTypeText(type))
      setTimeout(() => window.location.reload(), 300)
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const cycleUserType = () => {
  const types = ['SUPPLIER', 'BUYER', 'SHOPPER']
  const currentIndex = types.indexOf(data.user.userType)
  switchUserType(types[(currentIndex + 1) % types.length])
}

request.get("/notice/selectAll").then(res => {
  data.noticeList = res.data;
})

const NO_DATA_ID = -1

// 首页统计按登录身份收口：
// 管理员不传过滤条件，可查看全平台数据；普通用户只统计“自己发布/响应/购买”的数据。
const buildHomeDataScope = () => {
  const scope = {
    supplyParams: {},
    demandParams: {},
    matchParams: {},
    orderParams: {},
    goodsParams: {}
  }
  if (data.user.role !== 'USER') {
    return scope
  }
  scope.matchParams.relatedUserId = data.user.id
  if (data.user.userType === 'SUPPLIER') {
    scope.supplyParams.supplierId = data.user.id
    scope.demandParams.buyerId = NO_DATA_ID
    scope.orderParams.supplierId = data.user.id
    scope.goodsParams.supplierId = data.user.id
    return scope
  }
  if (data.user.userType === 'BUYER') {
    scope.supplyParams.supplierId = NO_DATA_ID
    scope.demandParams.buyerId = data.user.id
    scope.orderParams.userId = data.user.id
    scope.goodsParams.supplierId = NO_DATA_ID
    return scope
  }
  scope.supplyParams.supplierId = NO_DATA_ID
  scope.demandParams.buyerId = NO_DATA_ID
  scope.orderParams.userId = data.user.id
  scope.goodsParams.supplierId = NO_DATA_ID
  return scope
}

const { supplyParams, demandParams, matchParams, orderParams, goodsParams } = buildHomeDataScope()

request.get("/supply/selectAll", { params: supplyParams }).then(res => {
  data.supplyList = res.data || []
  data.stats.supply = data.supplyList.length
})

request.get("/purchaseDemand/selectAll", { params: demandParams }).then(res => {
  data.demandList = res.data || []
  data.stats.demand = data.demandList.length
})

request.get("/matchRecord/selectAll", { params: matchParams }).then(res => {
  data.matchList = res.data || []
  data.stats.match = data.matchList.length
  data.stats.matchOrders = data.matchList.filter(item => item.status === '已确认').length
  refreshOrderStat()
})

request.get("/orders/selectAll", { params: orderParams }).then(res => {
  data.orderList = res.data || []
  data.stats.goodsOrders = data.orderList.length
  refreshOrderStat()
})

if (data.user.role === 'USER') {
  request.get('/goods/selectAll', { params: goodsParams }).then(res => {
    data.goodsList = res.data || []
  })
}

if (data.user.userType === 'BUYER') {
  request.get('/matchRecommend/supplyForBuyer', { params: { buyerId: data.user.id } }).then(res => {
    data.recommendList = res.data || []
  })
}

if (data.user.userType === 'SUPPLIER') {
  request.get('/matchRecommend/demandForSupplier', { params: { supplierId: data.user.id } }).then(res => {
    data.recommendList = res.data || []
  })
}

</script>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 20px;
  margin-bottom: 20px;
}
.market-visual {
  min-height: 520px;
  background:
      linear-gradient(180deg, rgba(255,255,255,.98), rgba(249,253,246,.9)),
      radial-gradient(circle at 82% 10%, rgba(58,196,12,.14), transparent 28%);
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 18px;
  padding: 26px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 18px 44px rgba(20,66,31,.12);
}
.market-visual::after {
  content: "";
  position: absolute;
  width: 280px;
  height: 280px;
  right: -120px;
  bottom: -150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47,193,10,.16), transparent 68%);
  pointer-events: none;
}
.visual-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hero-title {
  color: #101810;
  font-size: 34px;
  font-weight: 800;
  line-height: 42px;
}
.hero-desc {
  color: #7a8376;
  margin-top: 4px;
}
.hero-badge {
  border-radius: 22px;
  padding: 10px 16px;
  color: #fff;
  background: linear-gradient(180deg, #2fc10a 0%, #158f08 100%);
  box-shadow: 0 14px 26px rgba(28, 150, 18, .26);
  position: relative;
  z-index: 1;
}
.switchable {
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
}
.switchable:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}
.field-stage {
  height: 300px;
  margin: 22px 0 20px;
  position: relative;
  border-radius: 22px;
  background:
      radial-gradient(circle at 50% 42%, rgba(73, 197, 25, .18), transparent 34%),
      linear-gradient(180deg, #fbfdf9 0%, #f4fbef 100%);
  box-shadow: inset 0 0 0 1px rgba(219,237,211,.72);
  overflow: hidden;
}
.field-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, rgba(75,174,40,.05) 0 18px, transparent 18px 36px);
  pointer-events: none;
}
.field-layer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,.7);
  box-shadow: 0 22px 42px rgba(29, 99, 28, .18);
  animation: fieldFloat 7s ease-in-out infinite alternate;
}
.layer-1 {
  width: 250px;
  height: 250px;
  bottom: 20px;
  background: repeating-linear-gradient(90deg, #7cc94b 0 12px, #61b838 12px 24px);
}
.layer-2 {
  width: 210px;
  height: 210px;
  bottom: 52px;
  background: repeating-linear-gradient(0deg, #b7df6c 0 10px, #8dcc45 10px 20px);
}
.layer-3 {
  width: 158px;
  height: 158px;
  bottom: 86px;
  background: radial-gradient(circle, #e4f5b4, #67b936);
}
.route-line {
  position: absolute;
  left: 21%;
  right: 20%;
  top: 48%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #38b30c, transparent);
}
.node {
  position: absolute;
  min-width: 64px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  color: #fff;
  background: rgba(22, 31, 23, .78);
  backdrop-filter: blur(8px);
  font-weight: 700;
  box-shadow: 0 10px 18px rgba(10, 30, 13, .18);
}
.supplier-node {
  left: 18%;
  top: 54%;
}
.match-node {
  left: 47%;
  top: 40%;
  background: linear-gradient(180deg, #2fc10a, #158f08);
}
.buyer-node {
  right: 17%;
  top: 54%;
}
.stage-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.stage-card {
  min-height: 116px;
  border-radius: 16px;
  background: rgba(245, 247, 244, .86);
  padding: 18px;
  border: 1px solid rgba(255,255,255,.72);
}
.stage-card.active {
  background: linear-gradient(180deg, #2fc10a 0%, #159008 100%);
  color: #fff;
}
.stage-card span,
.stage-card small {
  display: block;
  color: inherit;
  opacity: .78;
}
.stage-card strong {
  display: block;
  font-size: 42px;
  line-height: 54px;
  font-weight: 400;
}
.right-rail {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.alert-card {
  min-height: 236px;
  max-width: 100%;
  overflow: hidden;
  border-radius: 18px;
  padding: 22px;
  color: #fff;
  background:
      radial-gradient(circle at 90% 10%, rgba(255,255,255,.22), transparent 28%),
      linear-gradient(180deg, #42c20b 0%, #188c05 100%);
  box-shadow: 0 18px 34px rgba(28, 150, 18, .24);
}
.activity-card {
  max-width: 100%;
  overflow: hidden;
  border-radius: 18px;
  padding: 22px;
  background:
      linear-gradient(180deg, rgba(239,248,232,.92), rgba(225,242,214,.86));
  border: 1px solid rgba(255,255,255,.72);
  box-shadow: 0 16px 34px rgba(20,66,31,.1);
}
.rail-title {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 6px;
}
.rail-subtitle {
  color: #6b7a66;
  line-height: 20px;
  font-size: 13px;
  margin-bottom: 12px;
}
.flow-row {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,.35);
  color: #2b3a2d;
}
.flow-row span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3fc50d;
  box-shadow: 0 0 0 6px rgba(63, 197, 13, .12);
}
.stat-card {
  min-height: 112px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;
}
.stat-card::after {
  content: "";
  position: absolute;
  right: -44px;
  top: -54px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47,193,10,.12), transparent 68%);
}
.stat-title {
  color: #6b7a66;
  margin-bottom: 8px;
}
.stat-value {
  color: #1f2d24;
  font-size: 28px;
  font-weight: bold;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.supply .stat-icon {
  color: #176b24;
  background: #eaf7e7;
}
.demand .stat-icon {
  color: #996a05;
  background: #fff3d6;
}
.match .stat-icon {
  color: #1d63aa;
  background: #e8f2ff;
}
.order .stat-icon {
  color: #7a4cc2;
  background: #f1ebff;
}
.notice-list {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.notice-item {
  height: 28px;
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  font-size: 14px;
}
.notice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  flex: 0 0 auto;
}
.notice-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.notice-empty {
  color: inherit;
  opacity: .72;
  line-height: 28px;
}
.recommend-card {
  padding: 20px;
  margin-bottom: 18px;
}
.user-ai-card {
  min-height: 230px;
  display: grid;
  grid-template-columns: minmax(280px, .78fr) minmax(0, 1.22fr);
  gap: 18px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(42, 174, 18, .12);
  background:
      linear-gradient(135deg, rgba(255,255,255,.98), rgba(241,250,235,.94)),
      radial-gradient(circle at 90% 10%, rgba(48,193,10,.18), transparent 28%);
  overflow: hidden;
  position: relative;
}
.user-ai-card::after {
  content: "";
  position: absolute;
  right: -80px;
  bottom: -90px;
  width: 230px;
  height: 230px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(48,193,10,.16), transparent 65%);
}
.user-ai-main,
.user-ai-side {
  position: relative;
  z-index: 1;
}
.user-ai-main {
  min-height: 190px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border-radius: 16px;
  color: #fff;
  background:
      linear-gradient(135deg, rgba(13,70,23,.96), rgba(24,143,8,.92)),
      repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 10px, transparent 10px 20px);
}
.user-ai-orb {
  width: 118px;
  height: 118px;
  border-radius: 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: rgba(255,255,255,.14);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.16), 0 18px 28px rgba(4,50,13,.18);
}
.user-ai-orb span,
.user-ai-orb em {
  font-style: normal;
  opacity: .72;
}
.user-ai-orb strong {
  font-size: 40px;
  line-height: 45px;
  font-weight: 800;
}
.user-ai-kicker {
  color: rgba(255,255,255,.64);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 12px;
}
.user-ai-title {
  margin-top: 8px;
  font-size: 24px;
  line-height: 30px;
  font-weight: 900;
}
.user-ai-desc {
  margin-top: 8px;
  color: rgba(255,255,255,.78);
  line-height: 22px;
}
.user-ai-side {
  display: grid;
  gap: 12px;
}
.user-ai-report {
  min-height: 160px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255,255,255,.82);
  border: 1px solid rgba(39,84,52,.08);
}
.user-ai-report-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.user-ai-report-head span {
  color: #1f2d24;
  font-size: 18px;
  font-weight: 900;
}
.user-ai-lines {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.user-ai-lines p {
  margin: 0;
  min-height: 86px;
  padding: 12px;
  border-radius: 12px;
  color: #53624f;
  line-height: 20px;
  background: #f5faf2;
}
.user-ai-time {
  margin-top: 10px;
  color: #8a9585;
  font-size: 12px;
}
.user-ai-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #263238;
}
.section-subtitle {
  margin-top: 4px;
  color: #6b7a66;
  font-size: 13px;
}
.recommend-list {
  max-height: 190px;
  overflow-y: auto;
  padding-right: 4px;
}
.recommend-item {
  min-height: 85px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}
.recommend-item:last-child {
  border-bottom: none;
}
.recommend-info {
  flex: 1;
}
.recommend-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 6px;
}
.recommend-line {
  color: #666;
  line-height: 22px;
}
.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
}
.analytics-card {
  padding: 20px;
  min-height: 300px;
  overflow: hidden;
  position: relative;
}
.section-head.compact {
  margin-bottom: 14px;
}
.origin-board {
  height: 132px;
  position: relative;
  border-radius: 18px;
  background:
      radial-gradient(circle at 50% 50%, rgba(47, 193, 10, .2), transparent 42%),
      linear-gradient(135deg, #f7fcf3 0%, #eef8e8 100%);
  margin-bottom: 16px;
}
.origin-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 104px;
  height: 104px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(180deg, #39c20c 0%, #148e07 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 34px rgba(28, 150, 18, .28);
  z-index: 2;
}
.origin-core span,
.origin-core small {
  opacity: .78;
}
.origin-core strong {
  font-size: 34px;
  line-height: 36px;
  font-weight: 600;
}
.origin-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px solid rgba(43, 168, 18, .22);
  transform: translate(-50%, -50%) rotate(45deg);
}
.ring-a {
  width: 170px;
  height: 170px;
  border-radius: 32px;
}
.ring-b {
  width: 230px;
  height: 230px;
  border-radius: 42px;
}
.rank-list,
.balance-list,
.funnel-list {
  display: grid;
  gap: 12px;
}
.rank-row,
.balance-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 12px;
}
.rank-name,
.balance-name {
  color: #2a382a;
  font-weight: 700;
}
.rank-track,
.balance-line {
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: #edf2ea;
}
.rank-track span,
.balance-line span {
  height: 100%;
  display: block;
  border-radius: inherit;
  background: linear-gradient(90deg, #81d957, #169706);
}
.rank-value,
.balance-num {
  color: #6b7a66;
  text-align: right;
}
.balance-row {
  grid-template-columns: 80px minmax(0, 1fr) 54px;
}
.balance-bars {
  display: grid;
  gap: 6px;
}
.supply-line span {
  background: linear-gradient(90deg, #8ee36a, #138f06);
}
.demand-line span {
  background: linear-gradient(90deg, #ffe08a, #d99808);
}
.funnel-step {
  position: relative;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: #f2f6ef;
}
.funnel-label {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #203020;
  font-weight: 700;
}
.funnel-label strong {
  font-size: 22px;
  font-weight: 600;
}
.funnel-bar {
  height: 100%;
  min-width: 8%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(58, 196, 12, .4), rgba(21, 143, 8, .9));
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.status-item {
  min-height: 132px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #f7faf5;
}
.status-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
      radial-gradient(circle, #fff 58%, transparent 60%),
      conic-gradient(var(--color) var(--percent), #e5ece1 0);
}
.status-circle span {
  color: #203020;
  font-weight: 800;
  font-size: 14px;
}
.status-name {
  margin-top: 10px;
  color: #2a382a;
  font-weight: 700;
}
.status-count {
  margin-top: 4px;
  color: #7a8376;
  font-size: 12px;
}
.empty-tip {
  color: #8a9585;
  padding: 18px 0;
}
@media (max-width: 1100px) {
  .analytics-grid,
  .overview-grid {
    grid-template-columns: 1fr;
  }
  .user-ai-card,
  .user-ai-lines {
    grid-template-columns: 1fr;
  }
}
@keyframes fieldFloat {
  from {
    transform: translateX(-50%) rotate(45deg) translateY(0);
  }
  to {
    transform: translateX(-50%) rotate(45deg) translateY(-8px);
  }
}
</style>
