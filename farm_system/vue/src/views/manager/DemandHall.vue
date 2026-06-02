<template>
  <div>
    <div class="card page-title-panel">
      <div>
        <div class="page-title">{{ data.user.userType === 'BUYER' ? '发布采购意向' : '采购需求大厅' }}</div>
        <div class="page-subtitle">{{ data.user.userType === 'BUYER' ? '发布采购需求，等待供应商响应供货' : '查看采购需求，选择合适需求发起供货响应' }}</div>
      </div>
      <div class="page-title-icon"><el-icon><ShoppingCart /></el-icon></div>
    </div>

    <div class="card page-toolbar">
      <el-input v-model="data.productName" style="width: 260px" placeholder="请输入采购农产品名称"></el-input>
      <el-select v-model="data.categoryId" clearable placeholder="请选择分类" style="width: 180px">
        <el-option v-for="item in data.categories" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" @click="reset">重置</el-button>
    </div>

    <div class="card table-card" style="margin-bottom: 12px">
      <div class="table-actions" v-if="data.user.userType === 'BUYER'">
        <el-button type="primary" @click="handleAdd">发布采购需求</el-button>
      </div>
      <el-table :data="data.tableData" stripe>
        <el-table-column label="产品" prop="productName"></el-table-column>
        <el-table-column label="分类" prop="categoryName"></el-table-column>
        <el-table-column label="采购方" prop="buyerName"></el-table-column>
        <el-table-column label="剩余待采购量">
          <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
        </el-table-column>
        <el-table-column label="采购进度" width="160">
          <template #default="scope">
            <el-progress :percentage="getPurchasedPercent(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="期望价格" width="110">
          <template #default="scope">￥{{ scope.row.expectedPrice }}</template>
        </el-table-column>
        <el-table-column label="收货地区" prop="receiveArea"></el-table-column>
        <el-table-column label="截止时间" prop="deadline"></el-table-column>
        <el-table-column label="状态" prop="status" width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '已通过'" type="success">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === '已拒绝'" type="danger">已拒绝</el-tag>
            <el-tag v-else type="warning">待审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" header-align="center" width="240">
          <template #default="scope">
            <el-button v-if="data.user.userType === 'SUPPLIER' && scope.row.status === '已通过'" type="primary" @click="openIntent(scope.row)">我要供货</el-button>
            <el-button v-if="canEdit(scope.row)" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card pager-card" v-if="data.total > 0">
      <el-pagination background layout="prev, pager, next" v-model:page-size="data.pageSize" v-model:current-page="data.pageNum" :total="data.total" @current-change="load" />
    </div>

    <!-- 采购需求表单挂载到 body 并使用内部滚动，避免顶部悬浮栏遮挡和小屏高度截断。 -->
    <el-dialog
        title="采购需求"
        width="min(640px, calc(100vw - 32px))"
        v-model="data.formVisible"
        class="demand-form-dialog"
        modal-class="demand-form-overlay"
        append-to-body
        align-center
        :close-on-click-modal="false"
        destroy-on-close>
      <el-form :model="data.form" label-width="100px" class="demand-dialog-form">
        <el-form-item label="产品名称"><el-input v-model="data.form.productName" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="data.form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="item in data.categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购单位">
          <el-select v-model="data.form.unit" placeholder="请选择单位" style="width: 100%">
            <el-option label="斤" value="斤" />
            <el-option label="吨" value="吨" />
            <el-option label="个" value="个" />
          </el-select>
        </el-form-item>
        <el-form-item :label="'期望数量(' + (data.form.unit || '斤') + ')'"><el-input-number v-model="data.form.quantity" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="期望价格"><el-input-number v-model="data.form.expectedPrice" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="收货地区"><el-input v-model="data.form.receiveArea" /></el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="data.form.deadline" type="date" value-format="YYYY-MM-DD" placeholder="请选择截止时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="联系方式"><el-input v-model="data.form.contact" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="demand-dialog-footer">
          <el-button @click="data.formVisible = false">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="响应供货" width="35%" v-model="data.intentVisible" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="data.intentForm" label-width="100px" style="padding-right: 30px">
        <el-form-item :label="'可供数量(' + data.intentForm.unit + ')'"><el-input-number v-model="data.intentForm.quantity" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="供货报价"><el-input-number v-model="data.intentForm.price" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="留言"><el-input v-model="data.intentForm.message" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="data.intentVisible = false">取消</el-button>
        <el-button type="primary" @click="submitIntent">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import request from "@/utils/request";
import {reactive, watch} from "vue";
import {useRoute} from "vue-router";
import {ElMessageBox, ElMessage} from "element-plus";

const route = useRoute()

// 采购需求大厅：采购商发布需求，供应商对审核通过的需求进行供货响应。
const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  pageNum: 1,
  pageSize: 10,
  total: 0,
  productName: route.query.keyword || '',
  categoryId: null,
  tableData: [],
  categories: [],
  formVisible: false,
  form: {},
  intentVisible: false,
  intentForm: {}
})

const loadCategories = () => {
  request.get('/category/selectAll').then(res => {
    data.categories = res.data || []
  })
}

const load = () => {
  const params = {
    pageNum: data.pageNum,
    pageSize: data.pageSize,
    productName: data.productName,
    categoryId: data.categoryId
  }
  if (data.user.role === 'USER' && data.user.userType === 'BUYER') {
    params.buyerId = data.user.id
  }
  if (data.user.role === 'USER' && data.user.userType === 'SUPPLIER') {
    params.status = '已通过'
  }
  request.get('/purchaseDemand/selectPage', { params }).then(res => {
    data.tableData = sortDemandList(res.data?.list || [])
    data.total = res.data?.total || 0
  })
}

const canEdit = (row) => data.user.userType === 'BUYER' && row.buyerId === data.user.id

const getPurchasedPercent = (row) => {
  // 剩余待采购量为 0 时代表采购需求已满足，旧数据缺少 totalQuantity 也应显示 100%。
  if ((row.quantity || 0) <= 0) {
    return 100
  }
  const total = row.totalQuantity || row.quantity || 0
  if (!total) {
    return 0
  }
  return Math.min(100, Math.round(((total - (row.quantity || 0)) / total) * 100))
}

const sortDemandList = (list) => {
  return list.sort((a, b) => {
    const aFinished = (a.quantity || 0) <= 0 ? 1 : 0
    const bFinished = (b.quantity || 0) <= 0 ? 1 : 0
    if (aFinished !== bFinished) {
      return aFinished - bFinished
    }
    return getPurchasedPercent(b) - getPurchasedPercent(a)
  })
}

const handleAdd = () => {
  data.form = { buyerId: data.user.id, status: '待审核', unit: '斤' }
  data.formVisible = true
}

const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row))
  data.formVisible = true
}

const save = () => {
  if (data.user.role !== 'ADMIN') {
    data.form.buyerId = data.user.id
    data.form.status = data.form.status || '待审核'
  }
  const action = data.form.id ? request.put('/purchaseDemand/update', data.form) : request.post('/purchaseDemand/add', data.form)
  action.then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      data.formVisible = false
      load()
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const handleDelete = (id) => {
  ElMessageBox.confirm('删除后数据无法恢复，您确定删除吗?', '删除确认', { type: 'warning' }).then(() => {
    request.delete('/purchaseDemand/delete/' + id).then(res => {
      if (res.code === '200') {
        ElMessage.success('操作成功')
        load()
      } else {
        ElMessage.error(res.msg)
      }
    })
  }).catch(() => {})
}

const openIntent = (row) => {
  data.intentForm = { demandId: row.id, responseUserId: data.user.id, quantity: 1, unit: row.unit || '斤', price: row.expectedPrice, status: '待确认' }
  data.intentVisible = true
}

const submitIntent = () => {
  request.post('/matchRecord/add', data.intentForm).then(res => {
    if (res.code === '200') {
      ElMessage.success('供货响应已提交')
      data.intentVisible = false
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const reset = () => {
  data.productName = ''
  data.categoryId = null
  load()
}

// 顶部搜索跳转到采购需求大厅时，自动带入农产品关键词。
watch(() => route.query.keyword, (keyword) => {
  data.productName = keyword || ''
  data.pageNum = 1
  load()
})

loadCategories()
load()
</script>

<style scoped>
.pager-card {
  display: flex;
  justify-content: flex-end;
}
.demand-dialog-form {
  padding-right: 10px;
}
.demand-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Element Plus 弹窗挂载到 body 后，用全局选择器保持视口居中、内容滚动和底部按钮固定。 */
:global(.demand-form-overlay .el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
}
:global(.demand-form-dialog) {
  margin: 0 !important;
  max-height: calc(100vh - 48px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 78px rgba(13, 48, 24, .28);
}
:global(.demand-form-dialog .el-dialog__header) {
  flex: 0 0 auto;
  padding: 20px 28px 14px;
  margin-right: 0;
  border-bottom: 1px solid #e6eedf;
}
:global(.demand-form-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
}
:global(.demand-form-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  padding: 14px 28px 18px;
  border-top: 1px solid #e6eedf;
  background: rgba(255, 255, 255, .96);
}
:global(.demand-form-dialog .el-dialog__body::-webkit-scrollbar) {
  width: 8px;
}
:global(.demand-form-dialog .el-dialog__body::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  background: rgba(63, 139, 55, .28);
}
:global(.demand-form-dialog .el-dialog__body::-webkit-scrollbar-track) {
  background: transparent;
}
</style>
