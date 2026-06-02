<template>
  <div>
    <div class="card page-title-panel">
      <div>
        <div class="page-title">{{ data.user.userType === 'SUPPLIER' ? '供应信息发布' : '供应信息大厅' }}</div>
        <div class="page-subtitle">{{ data.user.userType === 'SUPPLIER' ? '发布并维护自己的农产品供应，审核通过后进入对接和商城流转' : '查看已审核供应，筛选合适货源并发起采购意向' }}</div>
      </div>
      <div class="page-title-icon"><el-icon><Sell /></el-icon></div>
    </div>

    <div class="card page-toolbar">
      <el-input v-model="data.productName" style="width: 260px" placeholder="请输入供应农产品名称"></el-input>
      <el-select v-model="data.categoryId" clearable placeholder="请选择分类" style="width: 180px">
        <el-option v-for="item in data.categories" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-select v-model="data.originProvince" clearable placeholder="请选择产地省份" style="width: 180px">
        <el-option v-for="item in data.provinces" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" @click="reset">重置</el-button>
    </div>

    <div class="card table-card" style="margin-bottom: 12px">
      <div class="table-actions" v-if="data.user.userType === 'SUPPLIER'">
        <el-button type="primary" @click="handleAdd">发布供应信息</el-button>
      </div>
      <el-table :data="data.tableData" stripe>
        <el-table-column label="产品" prop="productName"></el-table-column>
        <el-table-column label="图片" prop="img" width="90">
          <template #default="scope">
            <el-image v-if="scope.row.img" style="width: 50px; height: 50px; border-radius: 5px" :src="scope.row.img" :preview-src-list="[scope.row.img]" :preview-teleported="true" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column label="分类" prop="categoryName"></el-table-column>
        <el-table-column label="供应方" prop="supplierName"></el-table-column>
        <el-table-column label="省份" prop="originProvince"></el-table-column>
        <el-table-column label="产地" prop="originPlace"></el-table-column>
        <el-table-column label="单价" width="100">
          <template #default="scope">￥{{ scope.row.price }}/{{ scope.row.unit }}</template>
        </el-table-column>
        <el-table-column label="剩余供应量">
          <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
        </el-table-column>
        <el-table-column label="售出进度" width="160">
          <template #default="scope">
            <el-progress :percentage="getUsedPercent(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="上市时间" prop="availableTime"></el-table-column>
        <el-table-column label="状态" prop="status" width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '已通过'" type="success">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === '已拒绝'" type="danger">已拒绝</el-tag>
            <el-tag v-else type="warning">待审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" header-align="center" width="240">
          <template #default="scope">
            <el-button v-if="data.user.userType === 'BUYER' && scope.row.status === '已通过' && scope.row.quantity > 0" type="primary" @click="openIntent(scope.row)">发起采购意向</el-button>
            <el-button v-if="data.user.userType === 'BUYER' && scope.row.status === '已通过' && scope.row.quantity <= 0" type="info" disabled>已售罄</el-button>
            <el-button v-if="canEdit(scope.row)" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card pager-card" v-if="data.total > 0">
      <el-pagination background layout="prev, pager, next" v-model:page-size="data.pageSize" v-model:current-page="data.pageNum" :total="data.total" @current-change="load" />
    </div>

    <!-- 供应表单字段较多，弹窗挂载到 body 并在内部滚动，避免被顶部悬浮栏或视口高度截断。 -->
    <el-dialog
        title="供应信息"
        width="min(680px, calc(100vw - 32px))"
        v-model="data.formVisible"
        class="supply-form-dialog"
        modal-class="supply-form-overlay"
        append-to-body
        align-center
        :close-on-click-modal="false"
        destroy-on-close>
      <el-form :model="data.form" label-width="100px" class="supply-dialog-form">
        <el-form-item label="产品名称"><el-input v-model="data.form.productName" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="data.form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="item in data.categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片">
          <el-upload :action="uploadUrl" list-type="picture" :on-success="handleImgSuccess">
            <el-button type="primary">上传图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="产地省份">
          <el-select v-model="data.form.originProvince" placeholder="请选择省份" style="width: 100%">
            <el-option v-for="item in data.provinces" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细产地"><el-input v-model="data.form.originPlace" placeholder="如：寿光市、洛川县" /></el-form-item>
        <el-form-item label="规格单位">
          <el-select v-model="data.form.unit" placeholder="请选择单位" style="width: 100%">
            <el-option label="斤" value="斤" />
            <el-option label="吨" value="吨" />
            <el-option label="个" value="个" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价"><el-input-number v-model="data.form.price" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="可供数量"><el-input-number v-model="data.form.quantity" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="上市时间">
          <el-date-picker v-model="data.form.availableTime" type="date" value-format="YYYY-MM-DD" placeholder="请选择上市时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="联系方式"><el-input v-model="data.form.contact" /></el-form-item>
        <el-form-item label="状态" v-if="data.user.role === 'ADMIN'">
          <el-select v-model="data.form.status" style="width: 100%">
            <el-option label="待审核" value="待审核" />
            <el-option label="已通过" value="已通过" />
            <el-option label="已拒绝" value="已拒绝" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="supply-dialog-footer">
          <el-button @click="data.formVisible = false">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 采购意向弹窗也挂载到 body 并按视口居中，避免被页面内容区和顶部固定栏挤偏。 -->
    <el-dialog
        title="发起采购意向"
        width="min(560px, calc(100vw - 32px))"
        v-model="data.intentVisible"
        class="supply-intent-dialog"
        modal-class="supply-intent-overlay"
        append-to-body
        align-center
        :close-on-click-modal="false"
        destroy-on-close>
      <el-form :model="data.intentForm" label-width="100px" class="supply-intent-form">
        <el-form-item :label="'意向数量(' + data.intentForm.unit + ')'"><el-input-number v-model="data.intentForm.quantity" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="报价"><el-input-number v-model="data.intentForm.price" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="留言"><el-input v-model="data.intentForm.message" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="supply-intent-footer">
          <el-button @click="data.intentVisible = false">取消</el-button>
          <el-button type="primary" @click="submitIntent">提交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import request from "@/utils/request";
import {reactive, watch} from "vue";
import {useRoute} from "vue-router";
import {ElMessageBox, ElMessage} from "element-plus";

const uploadUrl = import.meta.env.VITE_BASE_URL + '/files/upload'
const route = useRoute()

// 供应信息大厅：供应商发布货源，采购商基于已审核货源发起采购意向。
const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  pageNum: 1,
  pageSize: 10,
  total: 0,
  productName: route.query.keyword || '',
  categoryId: null,
  originProvince: '',
  tableData: [],
  categories: [],
  provinces: ['河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆', '北京', '天津', '上海', '重庆', '香港', '澳门'],
  formVisible: false,
  form: {},
  intentVisible: false,
  intentForm: {},
  currentSupply: {}
})

const loadCategories = () => {
  request.get('/category/selectAll').then(res => {
    data.categories = res.data || []
  })
}

const load = () => {
  // 供应商只看自己的供应；采购商只看审核通过的供应；管理员可查看全部。
  const params = {
    pageNum: data.pageNum,
    pageSize: data.pageSize,
    productName: data.productName,
    categoryId: data.categoryId,
    originProvince: data.originProvince
  }
  if (data.user.role === 'USER' && data.user.userType === 'SUPPLIER') {
    params.supplierId = data.user.id
  }
  if (data.user.role === 'USER' && data.user.userType === 'BUYER') {
    params.status = '已通过'
  }
  request.get('/supply/selectPage', { params }).then(res => {
    data.tableData = sortSupplyList(res.data?.list || [])
    data.total = res.data?.total || 0
  })
}

const canEdit = (row) => data.user.userType === 'SUPPLIER' && row.supplierId === data.user.id

const getUsedPercent = (row) => {
  // 剩余量已经为 0 时代表供应已全部售出，即使旧数据缺少 totalQuantity 也应显示 100%。
  if ((row.quantity || 0) <= 0) {
    return 100
  }
  const total = row.totalQuantity || row.quantity || 0
  if (!total) {
    return 0
  }
  return Math.min(100, Math.round(((total - (row.quantity || 0)) / total) * 100))
}

const sortSupplyList = (list) => {
  return list.sort((a, b) => {
    const aSoldOut = (a.quantity || 0) <= 0 ? 1 : 0
    const bSoldOut = (b.quantity || 0) <= 0 ? 1 : 0
    if (aSoldOut !== bSoldOut) {
      return aSoldOut - bSoldOut
    }
    return getUsedPercent(b) - getUsedPercent(a)
  })
}

const handleAdd = () => {
  data.form = { supplierId: data.user.id, status: '待审核', unit: '斤' }
  data.formVisible = true
}

const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row))
  data.formVisible = true
}

const save = () => {
  // 普通供应商发布后进入待审核；管理员审核通过后，后端会同步生成/更新商城商品库存。
  // 若选择“吨”，后端会按 1 吨 = 2000 斤折算，商城购买界面最终只展示“斤/个”。
  if (data.user.role !== 'ADMIN') {
    data.form.supplierId = data.user.id
    data.form.status = data.form.status || '待审核'
  }
  const action = data.form.id ? request.put('/supply/update', data.form) : request.post('/supply/add', data.form)
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
    request.delete('/supply/delete/' + id).then(res => {
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
  data.currentSupply = row
  data.intentForm = { supplyId: row.id, responseUserId: data.user.id, quantity: 1, unit: row.unit || '斤', price: row.price, status: '待确认' }
  data.intentVisible = true
}

const submitIntent = () => {
  // 采购意向记录本次对接的数量、单位、报价，后续在“我的对接记录”里确认或拒绝。
  request.post('/matchRecord/add', data.intentForm).then(res => {
    if (res.code === '200') {
      ElMessage.success('采购意向已提交')
      data.intentVisible = false
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const reset = () => {
  data.productName = ''
  data.categoryId = null
  data.originProvince = ''
  load()
}

// 顶部搜索跳转到供应大厅时，自动带入农产品关键词。
watch(() => route.query.keyword, (keyword) => {
  data.productName = keyword || ''
  data.pageNum = 1
  load()
})

const handleImgSuccess = (res) => {
  data.form.img = res.data
}

loadCategories()
load()
</script>

<style scoped>
.pager-card {
  display: flex;
  justify-content: flex-end;
}
.supply-dialog-form {
  padding-right: 10px;
}
.supply-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.supply-intent-form {
  padding-right: 10px;
}
.supply-intent-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Element Plus 弹窗挂载到 body 后，需要用全局选择器保证它永远按视口居中且内容可滚动。 */
:global(.supply-form-overlay .el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
}
:global(.supply-form-dialog) {
  margin: 0 !important;
  max-height: calc(100vh - 48px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 78px rgba(13, 48, 24, .28);
}
:global(.supply-form-dialog .el-dialog__header) {
  flex: 0 0 auto;
  padding: 20px 28px 14px;
  margin-right: 0;
  border-bottom: 1px solid #e6eedf;
}
:global(.supply-form-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
}
:global(.supply-form-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  padding: 14px 28px 18px;
  border-top: 1px solid #e6eedf;
  background: rgba(255, 255, 255, .96);
}
:global(.supply-form-dialog .el-dialog__body::-webkit-scrollbar) {
  width: 8px;
}
:global(.supply-form-dialog .el-dialog__body::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  background: rgba(63, 139, 55, .28);
}
:global(.supply-form-dialog .el-dialog__body::-webkit-scrollbar-track) {
  background: transparent;
}

/* 采购意向弹窗字段较少，只需要稳定居中和固定底部按钮，不需要大表单滚动布局。 */
:global(.supply-intent-overlay .el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
}
:global(.supply-intent-dialog) {
  margin: 0 !important;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 28px 78px rgba(13, 48, 24, .28);
}
:global(.supply-intent-dialog .el-dialog__header) {
  padding: 20px 28px 14px;
  margin-right: 0;
  border-bottom: 1px solid #e6eedf;
}
:global(.supply-intent-dialog .el-dialog__body) {
  padding: 20px 28px 12px;
}
:global(.supply-intent-dialog .el-dialog__footer) {
  padding: 14px 28px 18px;
  border-top: 1px solid #e6eedf;
  background: rgba(255, 255, 255, .96);
}
</style>
