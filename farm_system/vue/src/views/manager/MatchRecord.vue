  <template>
  <div>
    <div class="card page-title-panel">
      <div>
        <div class="page-title">我的对接记录</div>
        <div class="page-subtitle">按采购和供应拆分查看，快速处理待确认意向</div>
      </div>
      <div class="page-title-icon"><el-icon><Connection /></el-icon></div>
    </div>

    <div class="card page-toolbar">
      <el-input v-model="data.productName" style="width: 260px" placeholder="请输入农产品名称查询"></el-input>
      <el-select v-model="data.status" clearable placeholder="请选择状态" style="width: 160px">
        <el-option label="待确认" value="待确认" />
        <el-option label="已确认" value="已确认" />
        <el-option label="已拒绝" value="已拒绝" />
        <el-option label="已支付" value="已支付" />
        <el-option label="待发货" value="待发货" />
        <el-option label="待收货" value="待收货" />
        <el-option label="已完成" value="已完成" />
        <el-option label="售后中" value="售后中" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" @click="reset">重置</el-button>
    </div>

    <div class="market-dashboard" v-if="data.user.userType === 'BUYER' || data.user.userType === 'SUPPLIER'">
      <div class="card market-hero">
        <div class="market-head">
          <div>
            <div class="market-title">{{ marketTitle }}</div>
            <div class="market-subtitle">{{ marketSubtitle }}</div>
          </div>
          <div class="market-pill">{{ data.user.userType === 'BUYER' ? '全平台货源' : '全平台需求' }}</div>
        </div>
        <div class="market-orbit">
          <div class="orbit-grid"></div>
          <div class="orbit-core">
            <span>{{ data.user.userType === 'BUYER' ? '供给' : '需求' }}</span>
            <strong>{{ visibleMarketList.length }}</strong>
            <small>条信息</small>
          </div>
          <div class="orbit-chip chip-left">{{ marketSummary.categoryCount }} 个匹配品类</div>
          <div class="orbit-chip chip-right">{{ marketSummary.areaCount }} 个匹配地区</div>
          <div class="orbit-chip chip-bottom">{{ marketSummary.totalQuantity }} {{ marketSummary.unitText }}</div>
        </div>
        <div class="market-stats">
          <div>
            <span>{{ data.user.userType === 'BUYER' ? '匹配货源' : '匹配需求' }}</span>
            <strong>{{ matchedMarketList.length }}</strong>
          </div>
          <div>
            <span>{{ data.user.userType === 'BUYER' ? '匹配供应量' : '匹配需求量' }}</span>
            <strong>{{ marketSummary.totalQuantity }}</strong>
          </div>
          <div>
            <span>{{ data.user.userType === 'BUYER' ? '最低供应价' : '最高期望价' }}</span>
            <strong>￥{{ data.user.userType === 'BUYER' ? marketSummary.minPrice : marketSummary.maxExpectedPrice }}</strong>
          </div>
          <div v-if="data.user.userType === 'SUPPLIER'">
            <span>最高预估利润</span>
            <strong>￥{{ marketSummary.maxProfit }}</strong>
          </div>
        </div>
      </div>

      <div class="card market-side">
        <div class="section-title">{{ data.user.userType === 'BUYER' ? '货源品类热度' : '需求品类热度' }}</div>
        <div class="section-subtitle">按农产品分类聚合，辅助判断优先对接方向</div>
        <div class="category-bars">
          <div class="category-row" v-for="item in categoryMarketRank" :key="item.name">
            <div class="category-name">{{ item.name }}</div>
            <div class="category-track"><span :style="{ width: item.percent + '%' }"></span></div>
            <div class="category-count">{{ item.count }}</div>
          </div>
          <div v-if="categoryMarketRank.length === 0" class="empty-tip">暂无市场数据</div>
        </div>
      </div>
    </div>

    <div class="market-card-grid" v-if="data.user.userType === 'BUYER' || data.user.userType === 'SUPPLIER'">
      <div class="supply-market-card" v-for="item in marketPreviewList" :key="marketItemKey(item)">
        <img v-if="data.user.userType === 'BUYER' && item.img" :src="item.img" alt="">
        <div v-else class="demand-icon">
          <el-icon><ShoppingCart /></el-icon>
        </div>
        <div class="market-card-main">
          <div class="market-card-name">{{ item.productName }}</div>
          <div class="market-card-meta">
            {{ data.user.userType === 'BUYER' ? (item.originProvince || '未填写省份') : (item.receiveArea || '未填写地区') }}
            · {{ item.categoryName || '未分类' }}
          </div>
          <div class="market-card-progress">
            <span>{{ data.user.userType === 'BUYER' ? '售出进度' : '采购进度' }}</span>
            <el-progress :percentage="getMarketProgress(item)" :show-text="false" />
            <em>{{ getMarketProgress(item) }}%</em>
          </div>
        </div>
        <div class="market-price">
          <span>{{ item.quantity }}{{ item.unit }}</span>
          <strong>￥{{ data.user.userType === 'BUYER' ? item.price : item.expectedPrice }}</strong>
        </div>
      </div>
      <div v-if="marketPreviewList.length === 0" class="card empty-market">暂无可展示的市场信息</div>
    </div>

    <div class="card table-card" style="margin-bottom: 5px">
      <el-tabs v-model="data.activeName" class="data-tabs">
        <el-tab-pane label="采购记录" name="purchase">
          <el-table :data="purchaseRecords" stripe class="record-table" scrollbar-always-on>
            <el-table-column label="农产品" prop="productName" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column label="供应方" prop="supplierName" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column label="采购方" prop="buyerName" width="130" show-overflow-tooltip></el-table-column>
            <el-table-column label="采购数量" width="100">
              <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
            </el-table-column>
            <el-table-column label="采购报价" prop="price" width="100"></el-table-column>
            <el-table-column label="留言" width="420">
              <template #default="scope">
                <el-tooltip
                    :content="scope.row.message || '暂无留言'"
                    placement="top"
                    effect="light"
                    popper-class="record-message-tooltip">
                  <div class="record-message">{{ scope.row.message || '-' }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="收货地址" width="360">
              <template #default="scope">
                <el-tooltip
                    :content="scope.row.deliveryAddress || '暂未填写收货地址'"
                    placement="top"
                    effect="light"
                    popper-class="record-message-tooltip">
                  <div class="record-address">{{ scope.row.deliveryAddress || '-' }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="状态" prop="status" width="100">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="createTime" width="160">
              <template #default="scope">
                <span class="record-time">{{ scope.row.createTime }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" header-align="center" width="240" fixed="right">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button
                      v-for="action in getRecordActions(scope.row, 'purchase')"
                      :key="action.name"
                      :type="action.type"
                      :disabled="action.disabled"
                      @click="handleRecordAction(scope.row, action)">
                    {{ action.label }}
                  </el-button>
                  <el-button type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="供应记录" name="supply">
          <el-table :data="supplyRecords" stripe class="record-table" scrollbar-always-on>
            <el-table-column label="农产品" prop="productName" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column label="供应方" prop="supplierName" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column label="采购方" prop="buyerName" width="130" show-overflow-tooltip></el-table-column>
            <el-table-column label="供应数量" width="100">
              <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
            </el-table-column>
            <el-table-column label="供货报价" prop="price" width="100"></el-table-column>
            <el-table-column label="留言" width="420">
              <template #default="scope">
                <el-tooltip
                    :content="scope.row.message || '暂无留言'"
                    placement="top"
                    effect="light"
                    popper-class="record-message-tooltip">
                  <div class="record-message">{{ scope.row.message || '-' }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="收货地址" width="360">
              <template #default="scope">
                <el-tooltip
                    :content="scope.row.deliveryAddress || '暂未填写收货地址'"
                    placement="top"
                    effect="light"
                    popper-class="record-message-tooltip">
                  <div class="record-address">{{ scope.row.deliveryAddress || '-' }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="状态" prop="status" width="100">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="createTime" width="160">
              <template #default="scope">
                <span class="record-time">{{ scope.row.createTime }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" header-align="center" width="240" fixed="right">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button
                      v-for="action in getRecordActions(scope.row, 'supply')"
                      :key="action.name"
                      :type="action.type"
                      :disabled="action.disabled"
                      @click="handleRecordAction(scope.row, action)">
                    {{ action.label }}
                  </el-button>
                  <el-button type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import request from "@/utils/request";
import {computed, reactive} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";

// 我的对接记录：展示当前用户参与过的采购意向和供货响应，管理员可查看全部记录。
const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  tableData: [],
  supplyMarketList: [],
  demandMarketList: [],
  mySupplyList: [],
  myDemandList: [],
  activeName: 'purchase',
  productName: '',
  status: ''
})

// 采购记录只展示当前用户作为采购方参与的数据，避免供应字段和采购字段混在一张表里产生空白列。
const purchaseRecords = computed(() => {
  if (data.user.role === 'ADMIN') {
    return data.tableData
  }
  return data.tableData.filter(item => item.buyerId === data.user.id || (item.supplyId && item.responseUserId === data.user.id))
})

// 供应记录只展示当前用户作为供应方参与的数据，页面含义更清楚，也避免无关字段留空。
const supplyRecords = computed(() => {
  if (data.user.role === 'ADMIN') {
    return data.tableData
  }
  return data.tableData.filter(item => item.supplierId === data.user.id || (item.demandId && item.responseUserId === data.user.id))
})

const visibleMarketList = computed(() => {
  if (data.user.userType === 'BUYER') {
    return data.supplyMarketList.filter(item => (item.quantity || 0) > 0)
  }
  if (data.user.userType === 'SUPPLIER') {
    return data.demandMarketList.filter(item => (item.quantity || 0) > 0)
  }
  return []
})

const normalizeName = (name) => (name || '').trim().toLowerCase()

const sameProduct = (source, target) => {
  const a = normalizeName(source)
  const b = normalizeName(target)
  if (!a || !b) {
    return false
  }
  return a === b || a.includes(b) || b.includes(a)
}

const myProductNames = computed(() => {
  const list = data.user.userType === 'BUYER' ? data.myDemandList : data.mySupplyList
  return list.filter(item => (item.quantity || 0) > 0).map(item => item.productName)
})

const matchedMarketList = computed(() => {
  if (myProductNames.value.length === 0) {
    return []
  }
  return visibleMarketList.value.filter(item => {
    return myProductNames.value.some(name => sameProduct(item.productName, name))
  })
})

const marketTitle = computed(() => {
  return data.user.userType === 'BUYER' ? '全平台供给货源概览' : '全平台采购需求概览'
})

const marketSubtitle = computed(() => {
  return data.user.userType === 'BUYER'
      ? '卡片展示全平台可用货源，核心指标只统计与你已发布采购意向匹配的货源'
      : '卡片展示全平台可用需求，核心指标结合你的供应价格、收货距离和期望价估算利润'
})

const getPercent = (value, max) => {
  if (!value || !max) {
    return 0
  }
  return Math.max(6, Math.round((value / max) * 100))
}

const categoryMarketRank = computed(() => {
  const map = {}
  visibleMarketList.value.forEach(item => {
    const name = item.categoryName || '未分类'
    map[name] = (map[name] || 0) + 1
  })
  const rows = Object.keys(map).map(name => ({ name, count: map[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  const max = Math.max(...rows.map(item => item.count), 0)
  return rows.map(item => ({ ...item, percent: getPercent(item.count, max) }))
})

const marketSummary = computed(() => {
  const list = matchedMarketList.value
  const categorySet = new Set()
  const areaSet = new Set()
  let quantity = 0
  let minPrice = null
  let maxExpectedPrice = null
  let maxProfit = null
  list.forEach(item => {
    categorySet.add(item.categoryName || '未分类')
    areaSet.add(data.user.userType === 'BUYER' ? (item.originProvince || '未填写') : (item.receiveArea || '未填写'))
    quantity += Number(item.quantity || 0)
    const currentPrice = Number(data.user.userType === 'BUYER' ? (item.price || 0) : (item.expectedPrice || 0))
    if (currentPrice > 0 && (minPrice === null || currentPrice < minPrice)) {
      minPrice = currentPrice
    }
    if (data.user.userType === 'SUPPLIER' && currentPrice > 0 && (maxExpectedPrice === null || currentPrice > maxExpectedPrice)) {
      maxExpectedPrice = currentPrice
    }
    if (data.user.userType === 'SUPPLIER') {
      const profit = getEstimatedProfit(item)
      if (maxProfit === null || profit > maxProfit) {
        maxProfit = profit
      }
    }
  })
  return {
    categoryCount: categorySet.size,
    areaCount: areaSet.size,
    totalQuantity: quantity,
    minPrice: minPrice === null ? '0.00' : minPrice.toFixed(2),
    maxExpectedPrice: maxExpectedPrice === null ? '0.00' : maxExpectedPrice.toFixed(2),
    maxProfit: maxProfit === null ? '0.00' : Math.max(0, maxProfit).toFixed(2),
    unitText: data.user.userType === 'BUYER' ? '剩余供应量' : '剩余待采购量'
  }
})

const getMatchedOwnSupply = (demand) => {
  return data.mySupplyList
      .filter(item => (item.quantity || 0) > 0 && sameProduct(item.productName, demand.productName))
      .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0]
}

const getTransportCost = (supply, demand) => {
  const origin = supply?.originProvince || ''
  const receiveArea = demand?.receiveArea || ''
  if (!origin || !receiveArea) {
    return 0.20
  }
  if (receiveArea.includes(origin) || origin.includes(receiveArea)) {
    return 0.05
  }
  return 0.20
}

// 供应商预估利润 = 采购方期望价 - 自己的供应报价 - 按收货距离估算的运输成本。
const getEstimatedProfit = (demand) => {
  const supply = getMatchedOwnSupply(demand)
  const expectedPrice = Number(demand.expectedPrice || 0)
  const supplyPrice = Number(supply?.price || 0)
  if (!expectedPrice || !supplyPrice) {
    return 0
  }
  return expectedPrice - supplyPrice - getTransportCost(supply, demand)
}

const marketPreviewList = computed(() => {
  return [...visibleMarketList.value]
      .sort((a, b) => getMarketProgress(b) - getMarketProgress(a))
      .slice(0, 6)
})

const marketItemKey = (item) => {
  return (data.user.userType === 'BUYER' ? 'supply-' : 'demand-') + item.id
}

// 撮合记录状态统一在这里映射，表格标签和按钮都依赖同一套状态文案，后续扩展不容易漏改。
const statusTagMap = {
  '待确认': 'warning',
  '已确认': 'success',
  '已拒绝': 'danger',
  '已支付': 'primary',
  '待发货': 'warning',
  '待收货': 'warning',
  '已完成': 'success',
  '售后中': 'danger',
  '售后已处理': 'info'
}

const getStatusText = (status) => status || '待确认'

const getStatusTagType = (status) => statusTagMap[status] || 'info'

const getMarketProgress = (row) => {
  if ((row.quantity || 0) <= 0) {
    return 100
  }
  const total = row.totalQuantity || row.quantity || 0
  if (!total) {
    return 0
  }
  return Math.min(100, Math.round(((total - (row.quantity || 0)) / total) * 100))
}

const load = () => {
  // 普通用户按 relatedUserId 查询自己相关的记录，包含发起人、供应方、采购方三种关联。
  const params = {
    productName: data.productName,
    status: data.status
  }
  if (data.user.role === 'USER') {
    params.relatedUserId = data.user.id
  }
  request.get('/matchRecord/selectAll', { params }).then(res => {
    data.tableData = res.data || []
  })
}

const loadMarketData = () => {
  // 采购商看全平台已通过供应；供应商看全平台已通过需求，用于图形化判断市场机会。
  if (data.user.userType === 'BUYER') {
    request.get('/supply/selectAll', { params: { status: '已通过' } }).then(res => {
      data.supplyMarketList = res.data || []
    })
    request.get('/purchaseDemand/selectAll', { params: { buyerId: data.user.id } }).then(res => {
      data.myDemandList = res.data || []
    })
  }
  if (data.user.userType === 'SUPPLIER') {
    request.get('/purchaseDemand/selectAll', { params: { status: '已通过' } }).then(res => {
      data.demandMarketList = res.data || []
    })
    request.get('/supply/selectAll', { params: { supplierId: data.user.id } }).then(res => {
      data.mySupplyList = res.data || []
    })
  }
}

const buildAction = (name, label, type = 'primary', disabled = false) => {
  return { name, label, type, disabled }
}

const getRecordActions = (row, recordType) => {
  const status = row.status || '待确认'
  if (status === '待确认') {
    return [
      buildAction('confirm', '确认', 'success'),
      buildAction('reject', '拒绝', 'danger')
    ]
  }
  if (status === '已拒绝') {
    return []
  }
  return recordType === 'purchase' ? getPurchaseActions(status, row) : getSupplyActions(status, row)
}

// 采购侧负责付款、填写地址、确认收货和发起售后，形成完整的买方履约链路。
const getPurchaseActions = (status, row) => {
  const actionMap = {
    '已确认': [buildAction('pay', '支付', 'primary')],
    '已支付': [buildAction('address', '填写收货地址', 'primary')],
    '待发货': [row.deliveryAddress ? buildAction('waitShip', '等待发货', 'info', true) : buildAction('address', '补填收货地址', 'primary')],
    '待收货': [buildAction('receive', '确认收货', 'success')],
    '已完成': [buildAction('afterSale', '申请售后', 'warning')],
    '售后中': [buildAction('afterSalePending', '售后处理中', 'info', true)],
    '售后已处理': [buildAction('afterSaleDone', '售后已处理', 'info', true)]
  }
  return actionMap[status] || []
}

// 供应侧不参与付款和收货确认，只在采购方付款填址后处理发货和售后，职责更贴近真实业务。
const getSupplyActions = (status, row) => {
  const actionMap = {
    '已确认': [buildAction('waitPay', '等待支付', 'info', true)],
    '已支付': [buildAction('waitAddress', '等待地址', 'info', true)],
    '待发货': [row.deliveryAddress ? buildAction('ship', '发货', 'success') : buildAction('waitAddress', '等待地址', 'info', true)],
    '待收货': [buildAction('viewAddress', '查看地址', 'primary')],
    '已完成': [buildAction('done', '已完成', 'info', true)],
    '售后中': [buildAction('processAfterSale', '处理售后', 'warning')],
    '售后已处理': [buildAction('afterSaleDone', '售后已处理', 'info', true)]
  }
  return actionMap[status] || []
}

const handleRecordAction = (row, action) => {
  if (action.disabled) {
    return
  }
  const actionHandlers = {
    confirm: () => changeStatus(row, '已确认'),
    reject: () => changeStatus(row, '已拒绝'),
    pay: () => payRecord(row),
    address: () => fillDeliveryAddress(row),
    ship: () => shipRecord(row),
    viewAddress: () => viewDeliveryAddress(row),
    receive: () => receiveRecord(row),
    afterSale: () => applyAfterSale(row),
    processAfterSale: () => processAfterSale(row)
  }
  actionHandlers[action.name]?.()
}

const updateRecordStatus = (row, status, extra = {}) => {
  const form = { ...JSON.parse(JSON.stringify(row)), ...extra, status }
  request.put('/matchRecord/update', form).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      load()
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const payRecord = (row) => {
  ElMessageBox.confirm('确认已完成本次采购支付吗？', '支付确认', { type: 'warning' }).then(() => {
    updateRecordStatus(row, '已支付')
  }).catch(() => {})
}

const fillDeliveryAddress = (row) => {
  ElMessageBox.prompt('请输入本次采购的收货地址', '填写收货地址', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputValue: row.deliveryAddress || '',
    inputPattern: /\S{5,}/,
    inputErrorMessage: '收货地址至少填写 5 个非空字符'
  }).then(({ value }) => {
    // 填写地址后进入待发货，由供应方完成发货后再进入待收货，避免供应侧没有可执行动作。
    updateRecordStatus(row, '待发货', { deliveryAddress: value.trim() })
  }).catch(() => {})
}

const shipRecord = (row) => {
  if (!row.deliveryAddress) {
    ElMessage.warning('采购方尚未填写收货地址')
    return
  }
  ElMessageBox.confirm(`确认已按以下地址发货吗？\n${row.deliveryAddress}`, '发货确认', { type: 'warning' }).then(() => {
    updateRecordStatus(row, '待收货')
  }).catch(() => {})
}

const viewDeliveryAddress = (row) => {
  ElMessageBox.alert(row.deliveryAddress || '采购方暂未填写收货地址', '收货地址')
}

const receiveRecord = (row) => {
  ElMessageBox.confirm('确认已经收到该批农产品吗？', '收货确认', { type: 'warning' }).then(() => {
    updateRecordStatus(row, '已完成')
  }).catch(() => {})
}

const applyAfterSale = (row) => {
  ElMessageBox.confirm('确认要申请售后吗？申请后供应方将在供应记录中处理。', '申请售后', { type: 'warning' }).then(() => {
    updateRecordStatus(row, '售后中')
  }).catch(() => {})
}

const processAfterSale = (row) => {
  ElMessageBox.confirm('确认已处理该售后申请吗？', '处理售后', { type: 'warning' }).then(() => {
    updateRecordStatus(row, '售后已处理')
  }).catch(() => {})
}

const changeStatus = (row, status) => {
  // 初始确认/拒绝仍保留原入口，后续履约状态统一交给 updateRecordStatus 处理。
  updateRecordStatus(row, status)
}

// 删除撮合记录采用后端软删除，隐藏当前记录但保留业务流水，方便后续统计和追溯。
const handleDelete = (id) => {
  ElMessageBox.confirm('删除后该对接记录将从列表隐藏，您确定删除吗?', '删除确认', { type: 'warning' }).then(() => {
    request.delete('/matchRecord/delete/' + id).then(res => {
      if (res.code === '200') {
        ElMessage.success('操作成功')
        load()
      } else {
        ElMessage.error(res.msg)
      }
    })
  }).catch(() => {})
}

const reset = () => {
  data.productName = ''
  data.status = ''
  load()
}

load()
loadMarketData()
</script>

<style scoped>
.market-dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
  gap: 14px;
  margin-bottom: 14px;
}
.market-hero,
.market-side {
  padding: 20px;
  overflow: hidden;
}
.market-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.market-title {
  color: #142116;
  font-size: 24px;
  font-weight: 800;
  line-height: 30px;
}
.market-subtitle,
.section-subtitle {
  color: #6b7a66;
  margin-top: 4px;
  line-height: 22px;
}
.market-pill {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 8px 14px;
  color: #fff;
  background: linear-gradient(180deg, #35c70d 0%, #158f08 100%);
  box-shadow: 0 10px 22px rgba(28, 150, 18, .2);
}
.market-orbit {
  height: 230px;
  position: relative;
  margin: 16px 0;
  border-radius: 18px;
  background:
      radial-gradient(circle at 50% 50%, rgba(56, 196, 12, .2), transparent 42%),
      linear-gradient(135deg, #fbfdf8 0%, #eef8e9 100%);
}
.orbit-grid {
  position: absolute;
  inset: 18px;
  border-radius: 20px;
  border: 1px solid rgba(43, 168, 18, .18);
  transform: rotate(3deg);
}
.orbit-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 126px;
  height: 126px;
  transform: translate(-50%, -50%);
  border-radius: 34px;
  color: #fff;
  background: linear-gradient(180deg, #39c20c 0%, #148e07 100%);
  box-shadow: 0 18px 40px rgba(28, 150, 18, .28);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.orbit-core span,
.orbit-core small {
  opacity: .78;
}
.orbit-core strong {
  font-size: 40px;
  line-height: 44px;
  font-weight: 600;
}
.orbit-chip {
  position: absolute;
  padding: 8px 12px;
  border-radius: 999px;
  color: #263238;
  background: rgba(255, 255, 255, .86);
  box-shadow: 0 10px 22px rgba(39, 84, 52, .1);
}
.chip-left {
  left: 12%;
  top: 42%;
}
.chip-right {
  right: 10%;
  top: 34%;
}
.chip-bottom {
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
}
.market-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}
.market-stats div {
  min-height: 82px;
  border-radius: 14px;
  padding: 14px;
  background: #f5f8f2;
}
.market-stats span {
  display: block;
  color: #6b7a66;
}
.market-stats strong {
  display: block;
  margin-top: 6px;
  color: #1f2d24;
  font-size: 28px;
  font-weight: 600;
}
.section-title {
  color: #263238;
  font-size: 18px;
  font-weight: 800;
}
.category-bars {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}
.category-row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 10px;
}
.category-name {
  color: #2a382a;
  font-weight: 700;
}
.category-track {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2ea;
}
.category-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #9ee477 0%, #159008 100%);
}
.category-count {
  color: #6b7a66;
  text-align: right;
}
.market-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.supply-market-card {
  min-height: 124px;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  background: rgba(255,255,255,.95);
  box-shadow: 0 12px 28px rgba(39, 84, 52, .08);
}
.supply-market-card img,
.demand-icon {
  width: 76px;
  height: 76px;
  border-radius: 8px;
}
.supply-market-card img {
  object-fit: cover;
  background: #f2f7ef;
}
.demand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #176b24;
  font-size: 28px;
  background: linear-gradient(180deg, #eef9e9, #dff2d6);
}
.market-card-main {
  min-width: 0;
}
.market-card-name {
  color: #1f2d24;
  font-size: 17px;
  font-weight: 800;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.market-card-meta {
  margin: 5px 0 10px;
  color: #6b7a66;
  font-size: 13px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.market-card-progress {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 8px;
  color: #7a8376;
  font-size: 12px;
}
.market-card-progress em {
  color: #1f2d24;
  font-style: normal;
  text-align: right;
}
.market-price {
  text-align: right;
}
.market-price span,
.market-price strong {
  display: block;
}
.market-price span {
  color: #6b7a66;
  margin-bottom: 8px;
}
.market-price strong {
  color: #d8392b;
  font-size: 18px;
}
.empty-tip,
.empty-market {
  color: #8a9585;
  padding: 18px 0;
}
.record-table {
  width: 100%;
}
.record-table :deep(.el-table__cell) {
  padding: 12px 0;
}
.record-message {
  max-width: 100%;
  color: #4e5b50;
  line-height: 22px;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.record-address {
  max-width: 100%;
  color: #39443c;
  line-height: 22px;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.record-time {
  display: inline-block;
  color: #39443c;
  line-height: 20px;
  white-space: normal;
}
:global(.record-message-tooltip) {
  max-width: 420px;
  line-height: 22px;
  word-break: break-word;
}
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}
.action-buttons :deep(.el-button) {
  margin-left: 0;
}
@media (max-width: 1200px) {
  .market-dashboard,
  .market-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
