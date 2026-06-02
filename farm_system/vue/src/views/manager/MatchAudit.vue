<template>
  <div>
    <div class="card page-title-panel">
      <div>
        <div class="page-title">供需审核管理</div>
        <div class="page-subtitle">集中审核供应、采购需求和撮合确认，保证平台信息可靠</div>
      </div>
      <div class="page-title-icon"><el-icon><Checked /></el-icon></div>
    </div>

    <div class="summary-grid">
      <div class="summary-card green">
        <span>待审核供应</span>
        <strong>{{ auditSummary.supplyPending }}</strong>
        <small>供应商提交的货源</small>
      </div>
      <div class="summary-card">
        <span>待审核需求</span>
        <strong>{{ auditSummary.demandPending }}</strong>
        <small>采购商发布的意向</small>
      </div>
      <div class="summary-card">
        <span>待确认撮合</span>
        <strong>{{ auditSummary.matchPending }}</strong>
        <small>需要双方或管理员确认</small>
      </div>
      <div class="summary-card">
        <span>已通过信息</span>
        <strong>{{ auditSummary.approved }}</strong>
        <small>供应与需求审核通过</small>
      </div>
    </div>

    <div class="card table-card">
      <el-tabs v-model="data.activeName" class="data-tabs" @tab-change="loadAll">
        <el-tab-pane label="供应审核" name="supply">
          <el-table :data="data.supplyList" stripe>
            <el-table-column label="产品" prop="productName"></el-table-column>
            <el-table-column label="供应方" prop="supplierName"></el-table-column>
            <el-table-column label="分类" prop="categoryName"></el-table-column>
            <el-table-column label="省份" prop="originProvince"></el-table-column>
            <el-table-column label="产地" prop="originPlace"></el-table-column>
            <el-table-column label="剩余量">
              <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
            </el-table-column>
            <el-table-column label="价格" prop="price"></el-table-column>
            <el-table-column label="状态" prop="status">
              <template #default="scope">
                <el-tag v-if="scope.row.status === '已通过'" type="success">已通过</el-tag>
                <el-tag v-else-if="scope.row.status === '已拒绝'" type="danger">已拒绝</el-tag>
                <el-tag v-else type="warning">待审核</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <el-button v-if="scope.row.status === '已通过'" type="warning" @click="changeSupplyStatus(scope.row, '已拒绝')">撤销</el-button>
                <template v-else-if="scope.row.status === '待审核'">
                  <el-button type="success" @click="changeSupplyStatus(scope.row, '已通过')">通过</el-button>
                  <el-button type="danger" @click="changeSupplyStatus(scope.row, '已拒绝')">拒绝</el-button>
                </template>
                <el-tag v-else type="info">已处理</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="需求审核" name="demand">
          <el-table :data="data.demandList" stripe>
            <el-table-column label="产品" prop="productName"></el-table-column>
            <el-table-column label="采购方" prop="buyerName"></el-table-column>
            <el-table-column label="分类" prop="categoryName"></el-table-column>
            <el-table-column label="剩余待采购量">
              <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
            </el-table-column>
            <el-table-column label="期望价格" prop="expectedPrice"></el-table-column>
            <el-table-column label="收货地区" prop="receiveArea"></el-table-column>
            <el-table-column label="状态" prop="status">
              <template #default="scope">
                <el-tag v-if="scope.row.status === '已通过'" type="success">已通过</el-tag>
                <el-tag v-else-if="scope.row.status === '已拒绝'" type="danger">已拒绝</el-tag>
                <el-tag v-else type="warning">待审核</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <el-button v-if="scope.row.status === '已通过'" type="warning" @click="changeDemandStatus(scope.row, '已拒绝')">撤销</el-button>
                <template v-else-if="scope.row.status === '待审核'">
                  <el-button type="success" @click="changeDemandStatus(scope.row, '已通过')">通过</el-button>
                  <el-button type="danger" @click="changeDemandStatus(scope.row, '已拒绝')">拒绝</el-button>
                </template>
                <el-tag v-else type="info">已处理</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="撮合确认" name="match">
          <el-table :data="data.matchList" stripe>
            <el-table-column label="农产品" prop="productName"></el-table-column>
            <el-table-column label="响应人" prop="responseUserName"></el-table-column>
            <el-table-column label="供应方" prop="supplierName"></el-table-column>
            <el-table-column label="采购方" prop="buyerName"></el-table-column>
            <el-table-column label="数量">
              <template #default="scope">{{ scope.row.quantity }}{{ scope.row.unit }}</template>
            </el-table-column>
            <el-table-column label="报价" prop="price"></el-table-column>
            <el-table-column label="状态" prop="status">
              <template #default="scope">
                <el-tag v-if="scope.row.status === '已确认'" type="success">已确认</el-tag>
                <el-tag v-else-if="scope.row.status === '已拒绝'" type="danger">已拒绝</el-tag>
                <el-tag v-else type="warning">待确认</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <el-button v-if="scope.row.status === '已确认'" type="warning" @click="changeMatchStatus(scope.row, '已拒绝')">撤销</el-button>
                <template v-else-if="scope.row.status === '待确认'">
                  <el-button type="success" @click="changeMatchStatus(scope.row, '已确认')">确认</el-button>
                  <el-button type="danger" @click="changeMatchStatus(scope.row, '已拒绝')">拒绝</el-button>
                </template>
                <el-tag v-else type="info">已处理</el-tag>
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
import {ElMessage} from "element-plus";

// 供需审核管理：管理员集中审核供应、采购需求，并辅助确认供需撮合记录。
const data = reactive({
  activeName: 'supply',
  supplyList: [],
  demandList: [],
  matchList: []
})

const auditSummary = computed(() => ({
  supplyPending: data.supplyList.filter(item => item.status === '待审核').length,
  demandPending: data.demandList.filter(item => item.status === '待审核').length,
  matchPending: data.matchList.filter(item => item.status === '待确认').length,
  approved: data.supplyList.filter(item => item.status === '已通过').length + data.demandList.filter(item => item.status === '已通过').length
}))

const loadAll = () => {
  request.get('/supply/selectAll').then(res => {
    data.supplyList = res.data || []
  })
  request.get('/purchaseDemand/selectAll').then(res => {
    data.demandList = res.data || []
  })
  request.get('/matchRecord/selectAll').then(res => {
    data.matchList = res.data || []
  })
}

const updateStatus = (url, row, status) => {
  // 供应信息审核通过时，后端 SupplyService 会自动把该供应同步到商城商品库存。
  const form = JSON.parse(JSON.stringify(row))
  form.status = status
  request.put(url, form).then(res => {
    if (res.code === '200') {
      ElMessage.success('操作成功')
      loadAll()
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const changeSupplyStatus = (row, status) => updateStatus('/supply/update', row, status)
const changeDemandStatus = (row, status) => updateStatus('/purchaseDemand/update', row, status)
const changeMatchStatus = (row, status) => updateStatus('/matchRecord/update', row, status)

loadAll()
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
</style>
