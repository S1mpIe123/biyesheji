<template>
  <div>

    <div class="card" style="margin-bottom: 5px;">
      <el-input v-model="data.name" style="width: 300px; margin-right: 10px" placeholder="请输入名称查询"></el-input>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button type="info" style="margin: 0 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 5px">
      <div style="margin-bottom: 10px">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
      <el-table :data="data.tableData" stripe>
        <el-table-column label="名称" prop="name"></el-table-column>
        <el-table-column label="图片" prop="img" width="120">
          <template #default="scope">
            <el-image v-if="scope.row.img" style="width: 50px; height: 50px; border-radius: 5px" :src="scope.row.img"
                      :preview-src-list="[scope.row.img]" :preview-teleported="true" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column label="简介" prop="descr"></el-table-column>
        <el-table-column label="特色" prop="specials"></el-table-column>
        <el-table-column label="价格" prop="price"></el-table-column>
        <el-table-column label="单位" prop="unit"></el-table-column>
        <el-table-column label="库存" prop="store"></el-table-column>
        <el-table-column label="分类" prop="categoryId">
          <template #default="scope">
            {{ getCategoryName(scope.row.categoryId) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" header-align="center" width="160">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card" v-if="data.total > 0">
      <el-pagination background layout="prev, pager, next" v-model:page-size="data.pageSize" v-model:current-page="data.pageNum" :total="data.total"/>
    </div>

    <!-- 农产品表单字段较多，弹窗按视口高度限制，表单内容滚动，避免底部分类和保存按钮被截断。 -->
    <el-dialog
        title="农产品信息"
        width="min(640px, calc(100vw - 32px))"
        v-model="data.formVisible"
        class="goods-form-dialog"
        modal-class="goods-form-overlay"
        append-to-body
        align-center
        :close-on-click-modal="false"
        destroy-on-close>
      <el-form :model="data.form" label-width="100px" class="goods-dialog-form">
        <el-form-item label="名称" prop="name">
          <el-input v-model="data.form.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="图片" prop="img">
          <el-upload :action="uploadUrl" list-type="picture" :on-success="handleImgSuccess">
            <el-button type="primary">
              上传图片
            </el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="描述" prop="descr">
          <el-input type="textarea" v-model="data.form.descr" autocomplete="off" />
        </el-form-item>
        <el-form-item label="特色" prop="specials">
          <el-input v-model="data.form.specials" autocomplete="off" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input v-model="data.form.price" autocomplete="off" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="data.form.unit" placeholder="请选择单位" style="width: 100%">
            <el-option label="斤" value="斤" />
            <el-option label="个" value="个" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存" prop="store">
          <el-input v-model="data.form.store" autocomplete="off" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="data.form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="item in data.categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>



      </el-form>
      <template #footer>
      <span class="dialog-footer goods-dialog-footer">
        <el-button @click="data.formVisible = false">取 消</el-button>
        <el-button type="primary" @click="save">保 存</el-button>
      </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import request from "@/utils/request";
import {reactive} from "vue";
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
  name: null,
  categories: []  // 存储分类列表
})

// 加载分类列表
const loadCategories = () => {
  request.get('/category/selectAll').then(res => {
    data.categories = res.data || []
  })
}

// 分页查询
const load = () => {
  request.get('/goods/selectPage', {
    params: {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      name: data.name
    }
  }).then(res => {
    data.tableData = res.data?.list
    data.total = res.data?.total
  })
}

// 新增
const handleAdd = () => {
  data.form = {}
  data.formVisible = true
}

// 编辑
const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row))
  data.formVisible = true
}

// 新增保存
const add = () => {
  request.post('/goods/add', data.form).then(res => {
    if (res.code === '200') {
      load()
      ElMessage.success('操作成功')
      data.formVisible = false
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 编辑保存
const update = () => {
  request.put('/goods/update', data.form).then(res => {
    if (res.code === '200') {
      load()
      ElMessage.success('操作成功')
      data.formVisible = false
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 弹窗保存
const save = () => {
  // data.form有id就是更新，没有就是新增
  data.form.id ? update() : add()
}

// 删除
const handleDelete = (id) => {
  ElMessageBox.confirm('删除后数据无法恢复，您确定删除吗?', '删除确认', { type: 'warning' }).then(res => {
    request.delete('/goods/delete/' + id).then(res => {
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
  data.name = null
  load()
}

// 处理文件上传的钩子
const handleImgSuccess = (res) => {
  data.form.img = res.data  // res.data就是文件上传返回的文件路径，获取到路径后赋值表单的属性
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = data.categories.find(c => c.id === categoryId)
  return category ? category.name : ''
}

load()
loadCategories()
</script>

<style scoped>
.goods-dialog-form {
  padding-right: 10px;
}

.goods-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Element Plus 弹窗挂载到 body 后，用全局选择器保证弹窗在视口内居中，表单主体可滚动。 */
:global(.goods-form-overlay .el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
}

:global(.goods-form-dialog) {
  margin: 0 !important;
  max-height: calc(100vh - 48px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 78px rgba(13, 48, 24, .28);
}

:global(.goods-form-dialog .el-dialog__header) {
  flex: 0 0 auto;
  padding: 20px 28px 14px;
  margin-right: 0;
  border-bottom: 1px solid #e6eedf;
}

:global(.goods-form-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
}

:global(.goods-form-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  padding: 14px 28px 18px;
  border-top: 1px solid #e6eedf;
  background: rgba(255, 255, 255, .96);
}

:global(.goods-form-dialog .el-dialog__body::-webkit-scrollbar) {
  width: 8px;
}

:global(.goods-form-dialog .el-dialog__body::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  background: rgba(63, 139, 55, .28);
}

:global(.goods-form-dialog .el-dialog__body::-webkit-scrollbar-track) {
  background: transparent;
}
</style>
