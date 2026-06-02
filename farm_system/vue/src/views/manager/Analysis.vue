<template>
  <div>
    <div class="analysis-hero">
      <div>
        <div class="hero-kicker">Data Insight</div>
        <div class="hero-title">产销对接数据分析看板</div>
        <div class="hero-desc">围绕供需发布、智能撮合、订单闭环和库存风险，集中展示平台运行质量。</div>
      </div>
      <div class="hero-orbit">
        <span>供给</span>
        <strong>{{ filteredSupplyList.length + filteredDemandList.length }}</strong>
        <em>供需样本</em>
      </div>
    </div>

    <div class="card filter-panel">
      <el-select v-model="data.filterProvince" clearable placeholder="按产地省份筛选" style="width: 180px">
        <el-option v-for="item in provinceOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="data.filterCategory" clearable placeholder="按农产品分类筛选" style="width: 180px">
        <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button type="primary" @click="clearFilters">查看全部</el-button>
      <div class="filter-tip">当前看板会随筛选条件联动，用于观察某个产地或品类的供需表现。</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card green">
        <span>供应信息</span>
        <strong>{{ filteredSupplyList.length }}</strong>
        <small>已发布货源总量：{{ totalSupplyQuantity }}</small>
      </div>
      <div class="kpi-card">
        <span>采购需求</span>
        <strong>{{ filteredDemandList.length }}</strong>
        <small>待采购总量：{{ totalDemandQuantity }}</small>
      </div>
      <div class="kpi-card">
        <span>撮合成功率</span>
        <strong>{{ confirmedRate }}%</strong>
        <small>已确认 / 全部撮合记录</small>
      </div>
      <div class="kpi-card">
        <span>订单闭环</span>
        <strong>{{ completedOrderRate }}%</strong>
        <small>已完成订单占比</small>
      </div>
    </div>

    <div class="card insight-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">AI 运营分析师</div>
          <div class="panel-subtitle">根据当前筛选结果，生成产销对接运营建议和分析报告</div>
        </div>
        <div class="report-actions">
          <el-button type="success" @click="generateAiReport">生成分析报告</el-button>
          <el-button @click="openAiReport">查看报告</el-button>
          <el-button type="primary" @click="exportAiReport">导出报告</el-button>
        </div>
      </div>
      <div class="insight-grid">
        <div class="insight-card" v-for="item in insightList" :key="item.title">
          <div class="insight-mark">{{ item.level }}</div>
          <div>
            <div class="insight-title">{{ item.title }}</div>
            <div class="insight-text">{{ item.text }}</div>
          </div>
        </div>
      </div>
      <div class="ai-report">
        <div class="ai-report-head">
          <span>AI Analysis</span>
          <em>{{ data.aiReportTime || '等待生成' }}</em>
        </div>
        <div class="ai-report-body">
          <p v-for="item in reportPreviewList" :key="item">{{ item }}</p>
        </div>
      </div>
    </div>

    <div class="analysis-grid top">
      <div class="card analysis-panel origin-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">产地热力分布</div>
            <div class="panel-subtitle">按供应省份聚合，观察农产品来源集中度</div>
          </div>
        </div>
        <div class="origin-visual">
          <div class="origin-core">
            <span>省份</span>
            <strong>{{ provinceRank.length }}</strong>
            <em>覆盖</em>
          </div>
          <div class="origin-lane lane-one"></div>
          <div class="origin-lane lane-two"></div>
          <div class="origin-lane lane-three"></div>
        </div>
        <div class="rank-list">
          <div class="rank-row" v-for="item in provinceRank" :key="item.name">
            <span>{{ item.name }}</span>
            <div><i :style="{ width: item.percent + '%' }"></i></div>
            <strong>{{ item.count }}</strong>
          </div>
          <div v-if="provinceRank.length === 0" class="empty-tip">暂无产地数据</div>
        </div>
      </div>

      <div class="card analysis-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">供需品类结构</div>
            <div class="panel-subtitle">绿色为供应，黄色为采购需求，缺口越大越值得关注</div>
          </div>
        </div>
        <div class="balance-list">
          <div class="balance-row" v-for="item in categoryBalance" :key="item.name">
            <div class="balance-name">{{ item.name }}</div>
            <div class="balance-bars">
              <div class="bar supply"><span :style="{ width: item.supplyPercent + '%' }"></span></div>
              <div class="bar demand"><span :style="{ width: item.demandPercent + '%' }"></span></div>
            </div>
            <div class="gap-tag" :class="{ warn: item.gap > 0 }">{{ item.gapText }}</div>
          </div>
          <div v-if="categoryBalance.length === 0" class="empty-tip">暂无品类数据</div>
        </div>
      </div>
    </div>

    <div class="analysis-grid bottom">
      <div class="card analysis-panel">
        <div class="panel-title">撮合转化漏斗</div>
        <div class="panel-subtitle">展示从供需信息发布到撮合确认再到订单完成的转化情况</div>
        <div class="funnel">
          <div class="funnel-step" v-for="item in funnelList" :key="item.label">
            <div class="funnel-label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="funnel-fill" :style="{ width: item.percent + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="card analysis-panel">
        <div class="panel-title">库存风险预警</div>
        <div class="panel-subtitle">优先展示库存低或已售罄的商城商品，便于管理员补货或下架</div>
        <div class="risk-list">
          <div class="risk-row" v-for="item in stockRiskList" :key="item.id">
            <div>
              <span>{{ item.name }}</span>
              <small>{{ item.categoryName || '未分类' }}</small>
            </div>
            <strong :class="{ danger: item.store <= 0, warn: item.store > 0 && item.store <= 100 }">{{ item.store }}{{ item.unit }}</strong>
          </div>
          <div v-if="stockRiskList.length === 0" class="empty-tip">暂无库存风险</div>
        </div>
      </div>

      <div class="card analysis-panel">
        <div class="panel-title">价格机会</div>
        <div class="panel-subtitle">比较同名农产品的供应价与采购期望价，辅助判断潜在利润空间</div>
        <div class="opportunity-list">
          <div class="opportunity-row" v-for="item in priceOpportunities" :key="item.name">
            <div>
              <span>{{ item.name }}</span>
              <small>供应 ￥{{ item.supplyPrice }} / 需求 ￥{{ item.demandPrice }}</small>
            </div>
            <strong>+{{ item.profit }}</strong>
          </div>
          <div v-if="priceOpportunities.length === 0" class="empty-tip">暂无价格机会</div>
        </div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="data.reportVisible" class="report-modal-mask" @click.self="data.reportVisible = false">
        <div class="report-modal">
          <div class="report-modal-head">
            <div>AI 产销对接分析报告</div>
            <button class="report-close" @click="data.reportVisible = false">×</button>
          </div>
          <div class="report-modal-body">
            <div class="report-paper">
              <div class="report-paper-head">
                <div>
                  <div class="paper-kicker">AgriLink AI Report</div>
                  <div class="paper-title">农产品产销对接运营分析</div>
                  <div class="paper-subtitle">生成时间：{{ data.aiReportTime || '未生成' }}</div>
                </div>
                <div class="paper-seal">AI</div>
              </div>
              <div class="report-summary-grid">
                <div>
                  <span>供应信息</span>
                  <strong>{{ filteredSupplyList.length }}</strong>
                </div>
                <div>
                  <span>采购需求</span>
                  <strong>{{ filteredDemandList.length }}</strong>
                </div>
                <div>
                  <span>撮合成功率</span>
                  <strong>{{ confirmedRate }}%</strong>
                </div>
                <div>
                  <span>订单闭环</span>
                  <strong>{{ completedOrderRate }}%</strong>
                </div>
              </div>
              <div class="report-section">
                <div class="report-section-title">核心判断</div>
                <p v-for="item in aiReportList" :key="item">{{ item }}</p>
              </div>
              <div class="report-section">
                <div class="report-section-title">运营建议</div>
                <p v-for="item in reportActionList" :key="item">{{ item }}</p>
              </div>
            </div>
          </div>
          <div class="report-modal-footer">
            <el-button @click="data.reportVisible = false">关闭</el-button>
            <el-button type="primary" @click="exportAiReport">导出报告</el-button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, reactive} from "vue";
import request from "@/utils/request";
import {ElMessage} from "element-plus";

const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  supplyList: [],
  demandList: [],
  matchList: [],
  orderList: [],
  goodsList: [],
  filterProvince: '',
  filterCategory: '',
  aiReportTime: '',
  reportVisible: false,
  typedReportList: [],
  reportTyping: false
})

let typingTimer = null

const getPercent = (value, max) => {
  if (!value || !max) {
    return 0
  }
  return Math.max(6, Math.round((value / max) * 100))
}

const totalSupplyQuantity = computed(() => {
  return filteredSupplyList.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
})

const totalDemandQuantity = computed(() => {
  return filteredDemandList.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
})

const provinceOptions = computed(() => {
  return [...new Set(data.supplyList.map(item => item.originProvince).filter(Boolean))]
})

const categoryOptions = computed(() => {
  return [...new Set([...data.supplyList, ...data.demandList].map(item => item.categoryName).filter(Boolean))]
})

const filteredSupplyList = computed(() => {
  return data.supplyList.filter(item => {
    const matchProvince = !data.filterProvince || item.originProvince === data.filterProvince
    const matchCategory = !data.filterCategory || item.categoryName === data.filterCategory
    return matchProvince && matchCategory
  })
})

const filteredDemandList = computed(() => {
  return data.demandList.filter(item => {
    const matchCategory = !data.filterCategory || item.categoryName === data.filterCategory
    return matchCategory
  })
})

const filteredGoodsList = computed(() => {
  return data.goodsList.filter(item => {
    return !data.filterCategory || item.categoryName === data.filterCategory
  })
})

const clearFilters = () => {
  data.filterProvince = ''
  data.filterCategory = ''
}

const getCurrentTimeText = () => {
  return new Date().toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 这里先采用本地规则模拟“AI 分析师”，后续如果接入大模型，只需要把这些数据摘要提交给后端 AI 接口。
const generateAiReport = () => {
  data.aiReportTime = getCurrentTimeText()
  startTypewriter()
  ElMessage.success('AI 分析报告已根据当前数据刷新')
}

const ensureAiReport = () => {
  if (!data.aiReportTime) {
    generateAiReport()
  }
}

const openAiReport = () => {
  ensureAiReport()
  data.reportVisible = true
}

const exportAiReport = () => {
  ensureAiReport()
  const content = buildReportText()
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '产销对接AI分析报告-' + data.aiReportTime.replace(/[/: ]/g, '-') + '.txt'
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('分析报告已导出')
}

const insightList = computed(() => {
  const insights = []
  const shortage = categoryBalance.value.find(item => item.gap > 0)
  if (shortage) {
    insights.push({
      level: '供需',
      title: shortage.name + '存在采购缺口',
      text: '当前需求数量高于供应信息，可优先引导供应商发布或补充该品类货源。'
    })
  }
  const risk = stockRiskList.value[0]
  if (risk) {
    insights.push({
      level: '库存',
      title: risk.name + '库存偏低',
      text: '当前库存为 ' + risk.store + risk.unit + '，建议管理员提醒供应方补货或及时下架售罄商品。'
    })
  }
  const opportunity = priceOpportunities.value[0]
  if (opportunity) {
    insights.push({
      level: '价格',
      title: opportunity.name + '存在利润空间',
      text: '采购期望价比供应价高 ' + opportunity.profit + ' 元，可优先进入撮合推荐或人工撮合。'
    })
  }
  if (!insights.length) {
    insights.push({
      level: '稳定',
      title: '当前供需结构较平衡',
      text: '暂无明显缺口或库存风险，可继续观察撮合转化率与订单完成情况。'
    })
  }
  return insights
})

const reportPreviewList = computed(() => {
  return data.typedReportList.length ? data.typedReportList : aiReportList.value
})

const aiReportList = computed(() => {
  const publishCount = filteredSupplyList.value.length + filteredDemandList.value.length
  const confirmedCount = data.matchList.filter(item => item.status === '已确认').length
  const shortage = categoryBalance.value.find(item => item.gap > 0)
  const risk = stockRiskList.value[0]
  const opportunity = priceOpportunities.value[0]
  const lines = [
    '当前筛选范围内共有 ' + publishCount + ' 条供需样本，其中供应 ' + filteredSupplyList.value.length + ' 条、采购需求 ' + filteredDemandList.value.length + ' 条，平台撮合确认记录为 ' + confirmedCount + ' 条。',
    shortage ? shortage.name + ' 的采购需求高于供应发布，建议管理员优先引导供应商补充货源，并将该品类放入智能推荐优先队列。' : '当前筛选范围内暂未发现明显品类缺口，可以继续观察价格差和订单转化情况。',
    risk ? risk.name + ' 的商城库存仅剩 ' + risk.store + risk.unit + '，建议与对应供应信息核对库存同步，避免用户下单后无法履约。' : '商城库存暂未触发低库存预警，说明当前已上架商品具备基本承接能力。',
    opportunity ? opportunity.name + ' 的采购期望价高于供应价 ' + opportunity.profit + ' 元，适合作为人工撮合或推荐算法的优先样本。' : '暂未发现明显价格套利空间，可重点提升供需信息完整度和撮合响应速度。'
  ]
  return lines
})

// 打字机效果只作用于看板预览区，弹窗报告仍展示完整文本，避免导出或阅读时被动画状态影响。
const startTypewriter = () => {
  if (typingTimer) {
    clearInterval(typingTimer)
  }
  const fullLines = aiReportList.value
  data.typedReportList = fullLines.map(() => '')
  data.reportTyping = true
  let lineIndex = 0
  let charIndex = 0
  typingTimer = setInterval(() => {
    if (lineIndex >= fullLines.length) {
      clearInterval(typingTimer)
      typingTimer = null
      data.reportTyping = false
      return
    }
    const current = fullLines[lineIndex]
    data.typedReportList[lineIndex] = current.slice(0, charIndex + 1)
    charIndex += 1
    if (charIndex >= current.length) {
      lineIndex += 1
      charIndex = 0
    }
  }, 18)
}

onBeforeUnmount(() => {
  if (typingTimer) {
    clearInterval(typingTimer)
  }
})

const reportActionList = computed(() => {
  const actions = []
  const shortageList = categoryBalance.value.filter(item => item.gap > 0).slice(0, 3)
  if (shortageList.length) {
    actions.push('优先补齐缺口品类：' + shortageList.map(item => item.name).join('、') + '，可通过公告、审核提醒或人工撮合引导供应方补货。')
  }
  if (stockRiskList.value.length) {
    actions.push('低库存商品需要复核：' + stockRiskList.value.map(item => item.name + '(' + item.store + item.unit + ')').join('、') + '，避免商城库存与供应库存不同步。')
  }
  if (priceOpportunities.value.length) {
    actions.push('存在明显价格机会的品类：' + priceOpportunities.value.map(item => item.name + '+￥' + item.profit).join('、') + '，建议放入智能匹配推荐优先级。')
  }
  actions.push('建议管理员每次新增演示数据后先查看本页图表，再进入供需审核管理确认状态，保证可视化与业务流程一致。')
  return actions
})

const buildReportText = () => {
  const filterText = [
    data.filterProvince ? '产地省份：' + data.filterProvince : '产地省份：全部',
    data.filterCategory ? '农产品分类：' + data.filterCategory : '农产品分类：全部'
  ].join('；')
  const sections = [
    '农产品产销对接平台 AI 分析报告',
    '生成时间：' + data.aiReportTime,
    '筛选条件：' + filterText,
    '',
    '一、核心指标',
    '供应信息：' + filteredSupplyList.value.length,
    '采购需求：' + filteredDemandList.value.length,
    '供应总量：' + totalSupplyQuantity.value,
    '待采购总量：' + totalDemandQuantity.value,
    '撮合成功率：' + confirmedRate.value + '%',
    '订单闭环率：' + completedOrderRate.value + '%',
    '',
    '二、AI 核心判断',
    ...aiReportList.value.map((item, index) => (index + 1) + '. ' + item),
    '',
    '三、运营建议',
    ...reportActionList.value.map((item, index) => (index + 1) + '. ' + item)
  ]
  return sections.join('\n')
}

const confirmedRate = computed(() => {
  if (!data.matchList.length) {
    return 0
  }
  return Math.round((data.matchList.filter(item => item.status === '已确认').length / data.matchList.length) * 100)
})

const completedOrderRate = computed(() => {
  if (!data.orderList.length) {
    return 0
  }
  return Math.round((data.orderList.filter(item => item.status === '已完成').length / data.orderList.length) * 100)
})

const provinceRank = computed(() => {
  const map = {}
  filteredSupplyList.value.forEach(item => {
    const name = item.originProvince || '未填写'
    map[name] = (map[name] || 0) + 1
  })
  const rows = Object.keys(map).map(name => ({ name, count: map[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  const max = Math.max(...rows.map(item => item.count), 0)
  return rows.map(item => ({ ...item, percent: getPercent(item.count, max) }))
})

const categoryBalance = computed(() => {
  const map = {}
  filteredSupplyList.value.forEach(item => {
    const name = item.categoryName || '未分类'
    map[name] = map[name] || { name, supply: 0, demand: 0 }
    map[name].supply += 1
  })
  filteredDemandList.value.forEach(item => {
    const name = item.categoryName || '未分类'
    map[name] = map[name] || { name, supply: 0, demand: 0 }
    map[name].demand += 1
  })
  const rows = Object.values(map).sort((a, b) => (b.supply + b.demand) - (a.supply + a.demand)).slice(0, 7)
  const max = Math.max(...rows.map(item => Math.max(item.supply, item.demand)), 0)
  return rows.map(item => ({
    ...item,
    gap: item.demand - item.supply,
    gapText: item.demand > item.supply ? '缺口 ' + (item.demand - item.supply) : '充足',
    supplyPercent: getPercent(item.supply, max),
    demandPercent: getPercent(item.demand, max)
  }))
})

const funnelList = computed(() => {
  const publish = filteredSupplyList.value.length + filteredDemandList.value.length
  const match = data.matchList.length
  const confirmed = data.matchList.filter(item => item.status === '已确认').length
  const completed = data.orderList.filter(item => item.status === '已完成').length
  const base = Math.max(publish, 1)
  return [
    { label: '供需发布', value: publish, percent: 100 },
    { label: '撮合记录', value: match, percent: getPercent(match, base) },
    { label: '确认撮合', value: confirmed, percent: getPercent(confirmed, base) },
    { label: '完成订单', value: completed, percent: getPercent(completed, base) }
  ]
})
//库存低于100阈值预警排序
const stockRiskList = computed(() => {
  return filteredGoodsList.value
      .filter(item => Number(item.store || 0) <= 100)
      .sort((a, b) => Number(a.store || 0) - Number(b.store || 0))
      .slice(0, 6)
})
//同名农产品供应价与采购期望价差利润计算
const priceOpportunities = computed(() => {
  const rows = []
  filteredSupplyList.value.forEach(supply => {
    filteredDemandList.value.forEach(demand => {
      if ((supply.productName || '').trim() === (demand.productName || '').trim()) {
        const supplyPrice = Number(supply.price || 0)
        const demandPrice = Number(demand.expectedPrice || 0)
        if (demandPrice > supplyPrice) {
          rows.push({
            name: supply.productName,
            supplyPrice: supplyPrice.toFixed(2),
            demandPrice: demandPrice.toFixed(2),
            profit: (demandPrice - supplyPrice).toFixed(2)
          })
        }
      }
    })
  })
  return rows.sort((a, b) => Number(b.profit) - Number(a.profit)).slice(0, 6)
})

const NO_DATA_ID = -1

// 分析看板的数据范围和首页保持一致：
// 管理员查看全平台运营数据；普通用户只能看到自己发布、响应或购买产生的数据。
const buildAnalysisDataScope = () => {
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

const load = () => {
  const { supplyParams, demandParams, matchParams, orderParams, goodsParams } = buildAnalysisDataScope()
  request.get('/supply/selectAll', { params: supplyParams }).then(res => {
    data.supplyList = res.data || []
  })
  request.get('/purchaseDemand/selectAll', { params: demandParams }).then(res => {
    data.demandList = res.data || []
  })
  request.get('/matchRecord/selectAll', { params: matchParams }).then(res => {
    data.matchList = res.data || []
  })
  request.get('/orders/selectAll', { params: orderParams }).then(res => {
    data.orderList = res.data || []
  })
  request.get('/goods/selectAll', { params: goodsParams }).then(res => {
    data.goodsList = res.data || []
  })
}

load()
</script>

<style scoped>
.analysis-hero {
  min-height: 210px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px;
  margin-bottom: 16px;
  color: #fff;
  border-radius: 8px;
  background:
      linear-gradient(90deg, rgba(11, 65, 24, .96), rgba(41, 157, 32, .82)),
      url("@/assets/imgs/bg.png") center/cover;
  box-shadow: 0 18px 42px rgba(23, 107, 36, .22);
  overflow: hidden;
  position: relative;
}
.analysis-hero::after {
  content: "";
  position: absolute;
  width: 360px;
  height: 360px;
  right: -120px;
  top: -120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.34), transparent 64%);
}
.hero-kicker {
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: .72;
}
.hero-title {
  margin-top: 8px;
  font-size: 34px;
  line-height: 42px;
  font-weight: 900;
}
.hero-desc {
  margin-top: 8px;
  color: rgba(255,255,255,.82);
}
.hero-orbit {
  width: 146px;
  height: 146px;
  border-radius: 42px;
  background: rgba(255,255,255,.16);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}
.hero-orbit span,
.hero-orbit em {
  opacity: .75;
  font-style: normal;
}
.hero-orbit strong {
  font-size: 44px;
  line-height: 50px;
}
.kpi-grid,
.analysis-grid.top,
.analysis-grid.bottom {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}
.kpi-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.analysis-grid.top {
  grid-template-columns: .9fr 1.1fr;
}
.analysis-grid.bottom {
  grid-template-columns: 1fr 1fr 1fr;
}
.kpi-card,
.analysis-panel {
  border-radius: 16px;
  padding: 20px;
  background: rgba(255,255,255,.94);
  box-shadow: 0 14px 34px rgba(39, 84, 52, .08);
}
.filter-panel {
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, .92);
  box-shadow: 0 14px 34px rgba(39, 84, 52, .08);
}
.filter-tip {
  color: #6b7a66;
  font-size: 13px;
}
.insight-panel {
  min-height: auto;
  margin-bottom: 16px;
  border: 1px solid rgba(44, 175, 20, .12);
  background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(241,249,236,.94));
}
.insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.insight-card {
  min-height: 92px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 15px;
  border-radius: 14px;
  background: rgba(255,255,255,.76);
  border: 1px solid rgba(39, 84, 52, .08);
}
.insight-mark {
  min-width: 46px;
  height: 30px;
  border-radius: 15px;
  color: #fff;
  background: linear-gradient(180deg, #35c50b, #128f06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(28,150,18,.18);
}
.insight-title {
  color: #1f2d24;
  font-weight: 900;
  margin-bottom: 6px;
}
.insight-text {
  color: #667460;
  font-size: 13px;
  line-height: 20px;
}
.ai-report {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  color: #dff8d8;
  background:
      linear-gradient(135deg, rgba(13, 70, 23, .96), rgba(23, 119, 12, .92)),
      radial-gradient(circle at 84% 14%, rgba(255,255,255,.24), transparent 28%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
}
.ai-report-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.ai-report-head span {
  color: #fff;
  font-weight: 900;
  letter-spacing: 1px;
}
.ai-report-head em {
  color: rgba(255,255,255,.68);
  font-style: normal;
  font-size: 12px;
}
.ai-report-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.ai-report-body p {
  margin: 0;
  min-height: 62px;
  padding: 12px;
  border-radius: 12px;
  line-height: 20px;
  color: rgba(255,255,255,.88);
  background: rgba(255,255,255,.08);
}
.kpi-card.green {
  color: #fff;
  background: linear-gradient(180deg, #40c20b 0%, #168f07 100%);
}
.kpi-card span,
.kpi-card small {
  display: block;
  opacity: .76;
}
.kpi-card strong {
  display: block;
  margin: 8px 0;
  font-size: 42px;
  line-height: 48px;
  font-weight: 600;
}
.analysis-panel {
  min-height: 330px;
  overflow: hidden;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}
.report-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.panel-title {
  color: #1f2d24;
  font-size: 20px;
  font-weight: 900;
}
.panel-subtitle {
  color: #6b7a66;
  margin-top: 5px;
  line-height: 22px;
}
.origin-visual {
  height: 150px;
  position: relative;
  margin: 18px 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #f6fcf1, #e8f6df);
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
  background: linear-gradient(180deg, #39c20c, #148e07);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 34px rgba(28,150,18,.24);
}
.origin-core span,
.origin-core em {
  opacity: .76;
  font-style: normal;
}
.origin-core strong {
  font-size: 34px;
  line-height: 36px;
}
.origin-lane {
  position: absolute;
  border: 1px solid rgba(42, 168, 18, .2);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
}
.lane-one { width: 140px; height: 140px; border-radius: 26px; }
.lane-two { width: 210px; height: 210px; border-radius: 38px; }
.lane-three { width: 280px; height: 280px; border-radius: 52px; }
.rank-list,
.balance-list,
.funnel,
.risk-list,
.opportunity-list {
  display: grid;
  gap: 12px;
}
.rank-row,
.balance-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr) 54px;
  gap: 10px;
  align-items: center;
}
.rank-row span,
.balance-name {
  color: #263238;
  font-weight: 800;
}
.rank-row div,
.bar {
  height: 11px;
  border-radius: 999px;
  background: #edf2ea;
  overflow: hidden;
}
.rank-row i,
.bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8ee36a, #138f06);
}
.rank-row strong {
  color: #6b7a66;
  text-align: right;
}
.balance-row {
  grid-template-columns: 86px minmax(0, 1fr) 72px;
}
.balance-bars {
  display: grid;
  gap: 6px;
}
.bar.demand span {
  background: linear-gradient(90deg, #ffe08a, #d99808);
}
.gap-tag {
  height: 26px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1f8f09;
  background: #eef9e8;
  font-size: 12px;
}
.gap-tag.warn {
  color: #9a6a05;
  background: #fff3d6;
}
.funnel-step {
  position: relative;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  background: #f2f6ef;
}
.funnel-label {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  color: #203020;
  font-weight: 800;
}
.funnel-label strong {
  font-size: 24px;
  font-weight: 600;
}
.funnel-fill {
  height: 100%;
  min-width: 8%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(58,196,12,.4), rgba(21,143,8,.9));
}
.risk-row,
.opportunity-row {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf2ea;
}
.risk-row span,
.opportunity-row span {
  display: block;
  color: #1f2d24;
  font-weight: 800;
}
.risk-row small,
.opportunity-row small {
  color: #7a8376;
}
.risk-row strong {
  color: #176b24;
}
.risk-row strong.warn {
  color: #d99808;
}
.risk-row strong.danger {
  color: #e54848;
}
.opportunity-row strong {
  color: #168f07;
  font-size: 20px;
}
.empty-tip {
  color: #8a9585;
  padding: 18px 0;
}
.report-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, .52);
  backdrop-filter: blur(3px);
}
.report-modal {
  width: min(760px, calc(100vw - 48px));
  height: min(820px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 28px 72px rgba(0, 0, 0, .32);
}
.report-modal-head {
  height: 62px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: #1f2d24;
  font-size: 18px;
  font-weight: 900;
  border-bottom: 1px solid #edf2ea;
}
.report-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 16px;
  color: #3d5bff;
  background: transparent;
  cursor: pointer;
  font-size: 28px;
  line-height: 28px;
}
.report-close:hover {
  background: #f2f6ef;
}
.report-modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px 0;
}
.report-modal-body::-webkit-scrollbar {
  width: 8px;
}
.report-modal-body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(28, 150, 18, .32);
}
.report-modal-body::-webkit-scrollbar-track {
  background: rgba(237, 242, 234, .72);
  border-radius: 999px;
}
.report-modal-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px;
  border-top: 1px solid #edf2ea;
}
.report-paper {
  min-height: 100%;
  padding: 20px;
  border-radius: 18px;
  background:
      linear-gradient(180deg, #fbfff8, #f3faee),
      radial-gradient(circle at 88% 0, rgba(48,193,10,.18), transparent 30%);
  border: 1px solid rgba(39, 84, 52, .08);
}
.report-paper-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.paper-kicker {
  color: #138f06;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.paper-title {
  margin-top: 6px;
  color: #1f2d24;
  font-size: 26px;
  font-weight: 900;
}
.paper-subtitle {
  margin-top: 6px;
  color: #6b7a66;
}
.paper-seal {
  width: 66px;
  height: 66px;
  border-radius: 22px;
  color: #fff;
  background: linear-gradient(180deg, #35c50b, #128f06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  box-shadow: 0 16px 30px rgba(28,150,18,.22);
}
.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.report-summary-grid div {
  min-height: 84px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255,255,255,.82);
  border: 1px solid rgba(39,84,52,.08);
}
.report-summary-grid span {
  display: block;
  color: #6b7a66;
}
.report-summary-grid strong {
  display: block;
  margin-top: 8px;
  color: #1f2d24;
  font-size: 28px;
}
.report-section {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255,255,255,.72);
  margin-top: 12px;
}
.report-section-title {
  color: #1f2d24;
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 10px;
}
.report-section p {
  margin: 0 0 9px;
  color: #52614e;
  line-height: 22px;
}
.report-section p:last-child {
  margin-bottom: 0;
}
@media (max-width: 1200px) {
  .kpi-grid,
  .analysis-grid.top,
  .analysis-grid.bottom {
    grid-template-columns: 1fr;
  }
  .filter-panel {
    flex-wrap: wrap;
  }
  .insight-grid {
    grid-template-columns: 1fr;
  }
  .ai-report-body {
    grid-template-columns: 1fr;
  }
  .report-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
