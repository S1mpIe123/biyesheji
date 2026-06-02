<template>
  <div>
    <div class="recommend-hero">
      <div>
        <div class="recommend-title">智能匹配推荐</div>
        <div class="recommend-desc">
          按农产品名称/品种、分类、供需时间、价格、地区和数量综合评分，优先推荐真正可对接的供需关系。
        </div>
      </div>
      <el-icon><TrendCharts /></el-icon>
    </div>

    <div class="card intro-card">
      <div class="muted-text">
        <span v-if="data.user.userType === 'BUYER'">根据你的采购需求，为你推荐最适合的供应信息。</span>
        <span v-if="data.user.userType === 'SUPPLIER'">根据你的供应信息，为你推荐最适合的采购需求。</span>
      </div>
    </div>

    <div class="ai-overview">
      <div class="ai-panel">
        <div class="ai-panel-title">AI 匹配模型</div>
        <div class="ai-panel-subtitle">名称优先，结合分类、时间、价格、地区和数量进行综合评分</div>
        <div class="model-bars">
          <div v-for="item in data.modelWeights" :key="item.name" class="model-row">
            <span>{{ item.name }}</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: item.value + '%' }"></div></div>
            <strong>{{ item.value }}%</strong>
          </div>
        </div>
      </div>
      <div class="ai-card primary">
        <span>推荐数量</span>
        <strong>{{ data.tableData.length }}</strong>
        <small>当前身份可对接机会</small>
      </div>
      <div class="ai-card">
        <span>最高匹配</span>
        <strong>{{ topScore }}%</strong>
        <small>优先处理高匹配记录</small>
      </div>
      <div class="ai-card">
        <span>平均匹配</span>
        <strong>{{ avgScore }}%</strong>
        <small>评估供需池整体质量</small>
      </div>
    </div>

    <div class="card table-card">
      <el-table :data="data.tableData" stripe>
        <el-table-column label="匹配度" width="140">
          <template #default="scope">
            <el-progress type="circle" :width="60" :percentage="scope.row.score" />
          </template>
        </el-table-column>
        <el-table-column label="农产品" min-width="120">
          <template #default="scope">
            <strong>{{ scope.row.productName }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="供应信息" min-width="190">
          <template #default="scope">
            <div class="info-main">{{ scope.row.supplyName }}</div>
            <div class="info-sub">产地：{{ scope.row.originProvince || '未填写' }}</div>
            <div class="info-sub">可供：{{ scope.row.availableTime || '未填写' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="采购需求" min-width="190">
          <template #default="scope">
            <div class="info-main">{{ scope.row.demandName }}</div>
            <div class="info-sub">收货地：{{ scope.row.receiveArea || '未填写' }}</div>
            <div class="info-sub">截止：{{ scope.row.deadline || '未填写' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数量">
          <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
        </el-table-column>
        <el-table-column label="供应价">
          <template #default="scope">￥{{ scope.row.supplyPrice }}</template>
        </el-table-column>
        <el-table-column label="期望价">
          <template #default="scope">￥{{ scope.row.expectedPrice }}</template>
        </el-table-column>
        <el-table-column label="推荐理由" min-width="210">
          <template #default="scope">
            <el-tag v-for="item in splitReason(scope.row.reason)" :key="item" class="reason-tag" type="success">{{ item }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分拆解" min-width="230">
          <template #default="scope">
            <div class="score-breakdown">
              <span v-for="item in getScoreItems(scope.row)" :key="item.label">
                {{ item.label }} {{ item.value }}%
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" @click="openIntent(scope.row)">
              {{ data.user.userType === 'BUYER' ? '发起采购意向' : '我要供货' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 智能匹配对接弹窗挂载到 body 并按视口居中，避免被顶部悬浮栏和页面滚动位置影响。 -->
    <el-dialog
        title="确认对接意向"
        width="min(520px, calc(100vw - 32px))"
        v-model="data.intentVisible"
        class="recommend-intent-dialog"
        modal-class="recommend-intent-overlay"
        append-to-body
        align-center
        :close-on-click-modal="false"
        destroy-on-close>
      <el-form :model="data.intentForm" label-width="100px" class="recommend-intent-form">
        <el-form-item :label="'数量(' + data.intentForm.unit + ')'">
          <el-input-number v-model="data.intentForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="报价">
          <el-input-number v-model="data.intentForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="留言">
          <el-input v-model="data.intentForm.message" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="recommend-intent-footer">
          <el-button @click="data.intentVisible = false">取消</el-button>
          <el-button type="primary" @click="submitIntent">提交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import request from "@/utils/request";
import {computed, reactive} from "vue";
import {ElMessage} from "element-plus";

// 智能匹配推荐：展示后端权重评分结果，并可一键生成撮合记录。
const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  tableData: [],
  intentVisible: false,
  intentForm: {},
  modelWeights: [
    { name: '名称/品种', value: 42 },
    { name: '分类匹配', value: 8 },
    { name: '供需时间', value: 17 },
    { name: '价格预期', value: 13 },
    { name: '地区匹配', value: 12 },
    { name: '数量匹配', value: 8 }
  ]
})

const topScore = computed(() => {
  if (!data.tableData.length) {
    return 0
  }
  return Math.max(...data.tableData.map(item => item.score || 0))
})

const avgScore = computed(() => {
  if (!data.tableData.length) {
    return 0
  }
  const total = data.tableData.reduce((sum, item) => sum + (item.score || 0), 0)
  return Math.round(total / data.tableData.length)
})

const load = () => {
  if (data.user.userType === 'BUYER') {
    request.get('/matchRecommend/supplyForBuyer', { params: { buyerId: data.user.id } }).then(res => {
      data.tableData = res.data || []
    })
  }
  if (data.user.userType === 'SUPPLIER') {
    request.get('/matchRecommend/demandForSupplier', { params: { supplierId: data.user.id } }).then(res => {
      data.tableData = res.data || []
    })
  }
}

const openIntent = (row) => {
  data.intentForm = {
    supplyId: row.supplyId,
    demandId: row.demandId,
    responseUserId: data.user.id,
    quantity: row.quantity || 1,
    unit: row.unit || '斤',
    price: data.user.userType === 'BUYER' ? row.supplyPrice : row.expectedPrice,
    message: '来自智能匹配推荐，匹配度' + row.score + '%：' + row.reason,
    status: '待确认'
  }
  data.intentVisible = true
}

const submitIntent = () => {
  request.post('/matchRecord/add', data.intentForm).then(res => {
    if (res.code === '200') {
      ElMessage.success('对接意向已提交')
      data.intentVisible = false
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const splitReason = (reason) => {
  return reason ? reason.split('、').filter(Boolean) : []
}

// 将后端分项评分转成百分比标签，让推荐算法的判断依据可视化，不再只是一个总分。
const getScoreItems = (row) => {
  return [
    { label: '品种', value: Math.round(((row.nameScore || 0) / 50) * 100) },
    { label: '分类', value: Math.round(((row.categoryScore || 0) / 10) * 100) },
    { label: '时间', value: Math.round(((row.timeScore || 0) / 20) * 100) },
    { label: '价格', value: Math.round(((row.priceScore || 0) / 15) * 100) },
    { label: '地区', value: Math.round(((row.areaScore || 0) / 15) * 100) },
    { label: '数量', value: Math.round(((row.quantityScore || 0) / 10) * 100) }
  ].filter(item => item.value > 0)
}

load()
</script>

<style scoped>
.recommend-hero {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #176b24 0%, #35964a 100%);
  border-radius: 8px;
  padding: 22px 24px;
  margin-bottom: 12px;
  color: #fff;
  box-shadow: 0 12px 28px rgba(23, 107, 36, .16);
}
.recommend-hero .el-icon {
  font-size: 42px;
  opacity: .78;
}
.recommend-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 32px;
}
.recommend-desc {
  color: rgba(255, 255, 255, .84);
  margin-top: 4px;
}
.intro-card {
  margin-bottom: 12px;
}
.ai-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 170px 170px 170px;
  gap: 14px;
  margin-bottom: 14px;
}
.ai-panel,
.ai-card {
  border-radius: 16px;
  padding: 18px;
  background: rgba(255,255,255,.92);
  box-shadow: 0 14px 34px rgba(39, 84, 52, .08);
}
.ai-panel {
  overflow: hidden;
  position: relative;
}
.ai-panel::after {
  content: "";
  position: absolute;
  width: 180px;
  height: 180px;
  right: -70px;
  top: -80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 193, 10, .22), rgba(47, 193, 10, 0) 68%);
}
.ai-panel-title {
  font-size: 20px;
  font-weight: 800;
  color: #1f2d24;
}
.ai-panel-subtitle {
  color: #6b7a66;
  margin: 4px 0 14px;
}
.model-row {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 10px;
  height: 30px;
  color: #5f6d5e;
}
.bar-track {
  height: 9px;
  border-radius: 10px;
  overflow: hidden;
  background: #edf2ea;
}
.bar-fill {
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg, #9ee57e, #2fc10a);
}
.ai-card {
  min-height: 132px;
}
.ai-card.primary {
  color: #fff;
  background: linear-gradient(180deg, #42c20b 0%, #188c05 100%);
}
.ai-card span,
.ai-card small {
  display: block;
  color: inherit;
  opacity: .72;
}
.ai-card strong {
  display: block;
  font-size: 42px;
  line-height: 58px;
  font-weight: 500;
}
.info-main {
  color: #333;
  font-weight: 600;
  line-height: 24px;
}
.info-sub {
  color: #777;
  font-size: 13px;
  line-height: 22px;
}
.reason-tag {
  margin: 2px 4px 2px 0;
}
.score-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.score-breakdown span {
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  color: #176b24;
  background: #eef9e8;
  font-size: 12px;
  line-height: 24px;
  white-space: nowrap;
}
.recommend-intent-form {
  padding-right: 10px;
}
.recommend-intent-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Element Plus 弹窗挂载到 body 后用全局选择器控制居中，确保不受业务页面滚动容器影响。 */
:global(.recommend-intent-overlay .el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
}
:global(.recommend-intent-dialog) {
  margin: 0 !important;
  max-height: calc(100vh - 48px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 78px rgba(13, 48, 24, .28);
}
:global(.recommend-intent-dialog .el-dialog__header) {
  flex: 0 0 auto;
  padding: 20px 28px 14px;
  margin-right: 0;
  border-bottom: 1px solid #e6eedf;
}
:global(.recommend-intent-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
}
:global(.recommend-intent-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  padding: 14px 28px 18px;
  border-top: 1px solid #e6eedf;
  background: rgba(255, 255, 255, .96);
}
</style>
