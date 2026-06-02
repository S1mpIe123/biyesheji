<template>
  <div>

    <div class="card page-title-panel">
      <div>
        <div class="page-title">订单管理</div>
        <div class="page-subtitle">小额农产品购买订单在这里处理，大额供需对接交易请到“我的对接记录”查看</div>
      </div>
      <div class="page-title-icon"><el-icon><Tickets /></el-icon></div>
    </div>

    <div class="card page-toolbar">
      <el-input v-model="data.orderNo" style="width: 300px" placeholder="请输入订单编号查询"></el-input>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" @click="reset">重置</el-button>
    </div>

    <div class="summary-grid">
      <div class="summary-card green">
        <span>全部订单</span>
        <strong>{{ orderSummary.total }}</strong>
        <small>小额购买订单</small>
      </div>
      <div class="summary-card">
        <span>待支付</span>
        <strong>{{ orderSummary.waitPay }}</strong>
        <small>需要用户完成付款</small>
      </div>
      <div class="summary-card">
        <span>待发货</span>
        <strong>{{ orderSummary.waitSend }}</strong>
        <small>直供订单由供应方处理</small>
      </div>
      <div class="summary-card">
        <span>已完成</span>
        <strong>{{ orderSummary.done }}</strong>
        <small>已完成收货闭环</small>
      </div>
    </div>

    <div class="card table-card" style="margin-bottom: 5px">
      <el-tabs v-model="data.activeName" class="data-tabs">
        <el-tab-pane :label="smallOrderTabLabel" name="goods">
          <div v-if="data.user.userType === 'SUPPLIER'" class="supplier-order-tip">
            这里只显示处理方为当前供货商的直供小额订单；大额采购/供应撮合记录请到“我的对接记录”处理。
          </div>
          <el-table :data="data.tableData" stripe>
        <el-table-column label="订单编号" prop="orderNo"></el-table-column>
        <el-table-column label="农产品名称" prop="goodsName"></el-table-column>
        <el-table-column label="农产品图片" prop="goodsImg">
          <template #default="scope">
            <el-image v-if="scope.row.goodsImg" style="width: 50px; height: 50px; border-radius: 5px" :src="scope.row.goodsImg"
                      :preview-src-list="[scope.row.goodsImg]" :preview-teleported="true" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column label="购买数量" prop="num"></el-table-column>
        <el-table-column label="下单人" prop="userName"></el-table-column>
        <el-table-column label="订单来源" width="150">
          <template #default="scope">
            <el-tag v-if="isDirectSupplyOrder(scope.row)" type="success">供货商直供</el-tag>
            <el-tag v-else type="info">平台商品</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理方" min-width="130" show-overflow-tooltip>
          <template #default="scope">
            {{ getOrderHandlerName(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="订单状态" prop="status">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '已取消'" type="danger">已取消</el-tag>
            <el-tag v-if="scope.row.status === '待支付'" type="warning">待支付</el-tag>
            <el-tag v-if="scope.row.status === '待发货'" type="primary">待发货</el-tag>
            <el-tag v-if="scope.row.status === '待收货'" type="primary">待收货</el-tag>
            <el-tag v-if="scope.row.status === '已完成'" type="success">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单日期" prop="time"></el-table-column>
        <el-table-column label="操作" header-align="center" width="150" fixed="right">
          <template #default="scope">
            <div class="order-actions">
              <el-button
                  v-if="getPrimaryAction(scope.row)"
                  :type="getPrimaryAction(scope.row).type"
                  @click="handlePrimaryAction(scope.row)"
              >
                {{ getPrimaryAction(scope.row).label }}
              </el-button>
              <el-dropdown trigger="click" @command="handleMoreCommand">
                <el-button plain>更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                        v-if="canCancelOrder(scope.row)"
                        :command="{ action: 'cancel', row: scope.row }"
                    >
                      取消订单
                    </el-dropdown-item>
                    <el-dropdown-item v-if="canDeleteOrder(scope.row)" :command="{ action: 'delete', row: scope.row }">
                      删除记录
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'trace', row: scope.row, type: 'goods' }">
                      查看溯源
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 溯源弹窗脱离页面滚动容器并按视口居中，避免在页面中部或底部打开时顶部被截断。 -->
    <el-dialog
        title="农产品订单溯源链"
        v-model="data.traceVisible"
        width="min(640px, calc(100vw - 32px))"
        class="trace-dialog"
        modal-class="trace-dialog-overlay"
        append-to-body
        align-center
        destroy-on-close
    >
      <el-timeline class="trace-timeline">
        <el-timeline-item
            v-for="item in data.traceList"
            :key="item.title"
            :timestamp="item.time"
            :type="item.done ? 'success' : 'info'"
        >
          <div class="trace-title">{{ item.title }}</div>
          <div class="trace-desc">{{ item.desc }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>

  </div>
</template>

<script setup>
import request from "@/utils/request";
import {computed, reactive} from "vue";
import {ElMessageBox, ElMessage} from "element-plus";

// 文件上传的接口地址
const uploadUrl = import.meta.env.VITE_BASE_URL + '/files/upload'

const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  pageNum: 1,
  pageSize: 10,
  total: 0,
  formVisible: false,
  form: {},
  tableData: [],
  activeName: 'goods',
  orderNo: null,
  traceVisible: false,
  traceList: []
})

// 分页查询
const load = () => {
  const params = {
    pageNum: data.pageNum,
    pageSize: data.pageSize,
    orderNo: data.orderNo
  }
  if (data.user.role !== 'ADMIN' && data.user.userType === 'SUPPLIER') {
    params.supplierId = data.user.id
  } else if (data.user.role !== 'ADMIN') {
    params.userId = data.user.id
  }
  request.get('/orders/selectPage', {
    params
  }).then(res => {
    data.tableData = res.data?.list
    data.total = res.data?.total
  })
}

const smallOrderTabLabel = computed(() => data.user.userType === 'SUPPLIER' ? '小额农产品购买' : '农产品购买订单')

const isDirectSupplyOrder = (row) => !!row.sourceSupplyId

const isMyDirectSupplyOrder = (row) => {
  return data.user.role === 'USER' && data.user.userType === 'SUPPLIER' && row.supplierId === data.user.id
}

const isOrderBuyer = (row) => {
  return data.user.role === 'USER' && row.userId === data.user.id
}

const getOrderHandlerName = (row) => {
  if (isDirectSupplyOrder(row)) {
    return row.supplierName || '供货商'
  }
  return '平台管理员'
}

// 订单操作区只展示一个当前最重要动作，其余低频动作收进下拉菜单，避免按钮挤在一起。
const getPrimaryAction = (row) => {
  if (isOrderBuyer(row) && row.status === '待支付') {
    return { label: '支付', status: '待发货', type: 'primary' }
  }
  if (row.status === '待发货' && canShipOrder(row)) {
    return { label: '发货', status: '待收货', type: 'primary' }
  }
  if (isOrderBuyer(row) && row.status === '待收货') {
    return { label: '收货', status: '已完成', type: 'success' }
  }
  return null
}

const handlePrimaryAction = (row) => {
  const action = getPrimaryAction(row)
  if (action) {
    changeStatus(row, action.status)
  }
}

const handleMoreCommand = ({ action, row, type }) => {
  if (action === 'cancel') {
    changeStatus(row, '已取消')
  }
  if (action === 'delete') {
    handleDelete(row.id)
  }
  if (action === 'trace') {
    openTrace(row, type || 'goods')
  }
}

// 采购商在确认收货前都可以取消订单；后端会在这些状态取消时释放库存，已完成后不再允许取消入口。
const canCancelOrder = (row) => {
  return isOrderBuyer(row) && ['待支付', '待发货', '待收货'].includes(row.status)
}

// 删除只是隐藏自己的订单记录；供货商处理直供订单时不提供删除入口，避免误隐藏采购方订单。
const canDeleteOrder = (row) => {
  return data.user.role === 'ADMIN' || isOrderBuyer(row)
}

// 供货商直供订单由对应供货商发货；普通平台商品仍由管理员发货。
const canShipOrder = (row) => {
  if (isDirectSupplyOrder(row)) {
    return isMyDirectSupplyOrder(row)
  }
  return data.user.role === 'ADMIN'
}

const orderSummary = computed(() => {
  const goodsOrders = data.tableData || []
  return {
    total: goodsOrders.length,
    waitPay: goodsOrders.filter(item => item.status === '待支付').length,
    waitSend: goodsOrders.filter(item => item.status === '待发货').length,
    done: goodsOrders.filter(item => item.status === '已完成').length
  }
})

// 简易溯源链：把供需发布、审核、响应、确认和订单完成串成时间轴，突出农业信息化的过程可追踪。
const openTrace = (row, type) => {
  data.traceList = buildGoodsTrace(row)
  data.traceVisible = true
}

const buildGoodsTrace = (row) => {
  return [
    { title: '供应商发布货源', time: '供应审核阶段', desc: row.goodsName + ' 来源于已审核供应或商城商品。', done: true },
    { title: '管理员审核上架', time: '商品上架', desc: '审核通过后进入农产品购买页面，库存与供应信息保持同步。', done: true },
    { title: '日常用户下单', time: row.time || '下单时间未记录', desc: '购买数量：' + (row.num || 0) + '，订单编号：' + row.orderNo, done: true },
    { title: '支付与发货', time: row.status || '处理中', desc: '当前订单状态：' + (row.status || '未知') + '。', done: ['待发货', '待收货', '已完成'].includes(row.status) },
    { title: '订单完成', time: row.status === '已完成' ? '已完成' : '待完成', desc: '完成后形成农产品购买闭环。', done: row.status === '已完成' }
  ]
}

// 操作按钮,扭转订单的状态
const changeStatus = (row, status) => {
  const submitStatus = () => {
    const form = {
      ...JSON.parse(JSON.stringify(row)),
      status,
      operatorId: data.user.id,
      operatorRole: data.user.role
    }
    request.put('/orders/update', form).then(res => {
      if (res.code === '200') {
        load()
        ElMessage.success('操作成功')
        data.formVisible = false
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
  if (status === '已取消') {
    ElMessageBox.confirm('确认取消该订单吗？确认收货前取消会释放库存，已完成订单不会回补库存。', '取消订单', { type: 'warning' }).then(() => {
      submitStatus()
    }).catch(() => {})
    return
  }
  submitStatus()
}



// 删除订单采用后端软删除：页面隐藏该订单，但不破坏历史订单和库存流转记录。
const handleDelete = (id) => {
  ElMessageBox.confirm('删除后该订单将从列表隐藏，您确定删除吗?', '删除确认', { type: 'warning' }).then(res => {
    request.delete('/orders/delete/' + id).then(res => {
      if (res.code === '200') {
        load()
        ElMessage.success('操作成功')
      } else {
        ElMessage.error(res.msg)
      }
    })
  }).catch(err => {})
}

// 重置
const reset = () => {
  data.orderNo = null
  load()
}

// 处理文件上传的钩子
const handleImgSuccess = (res) => {
  data.form.avatar = res.data  // res.data就是文件上传返回的文件路径，获取到路径后赋值表单的属性
}

load()
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.summary-card {
  min-height: 116px;
  border-radius: 16px;
  padding: 18px;
  background: rgba(255,255,255,.92);
  box-shadow: 0 14px 34px rgba(39, 84, 52, .08);
}
.summary-card.green {
  color: #fff;
  background: linear-gradient(180deg, #42c20b 0%, #188c05 100%);
}
.summary-card span,
.summary-card small {
  display: block;
  color: inherit;
  opacity: .72;
}
.summary-card strong {
  display: block;
  font-size: 38px;
  line-height: 50px;
  font-weight: 500;
}
.order-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.order-actions :deep(.el-button) {
  margin-left: 0;
}
.supplier-order-tip {
  margin: 0 16px 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #496047;
  background: #f3faef;
  border: 1px solid #dcefd4;
}
.trace-title {
  color: #1f2d24;
  font-weight: 800;
}
.trace-desc {
  margin-top: 4px;
  color: #667460;
  line-height: 21px;
}
.trace-timeline {
  padding: 4px 6px 0 0;
}

/* Element Plus 弹窗会挂载到 body，内部结构需要用全局选择器固定在视口中心。 */
:global(.trace-dialog-overlay .el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
}
:global(.trace-dialog) {
  margin: 0 !important;
  max-height: calc(100vh - 48px);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 70px rgba(26, 51, 32, .28);
}
:global(.trace-dialog .el-dialog__header) {
  padding: 20px 28px 14px;
  border-bottom: 1px solid #e6eedf;
  margin-right: 0;
}
:global(.trace-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 18px 28px 24px;
}
</style>
