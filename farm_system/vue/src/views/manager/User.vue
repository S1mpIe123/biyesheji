<template>
  <div>

    <div class="card" style="margin-bottom: 5px;">
      <el-input v-model="data.name" style="width: 300px; margin-right: 10px" placeholder="请输入名称查询"></el-input>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="info" style="margin: 0 10px" @click="reset">重置</el-button>
    </div>

    <div class="card" style="margin-bottom: 5px">
      <div style="margin-bottom: 10px">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </div>
      <el-table :data="data.tableData" stripe>
        <el-table-column label="用户名" prop="username"></el-table-column>
        <el-table-column label="名称" prop="name"></el-table-column>
        <el-table-column label="头像">
          <template #default="scope">
            <el-image :src="scope.row.avatar" style="width: 40px; height: 40px; border-radius: 50%"></el-image>
          </template>
        </el-table-column>
        <el-table-column label="角色" prop="role">
          <template #default="scope">
            <span v-if="scope.row.role === 'USER'">普通用户</span>
          </template>
        </el-table-column>
        <el-table-column label="用户身份" prop="userType">
          <template #default="scope">
            <el-tag v-if="scope.row.userType === 'SUPPLIER'" type="success">供应方</el-tag>
            <el-tag v-else-if="scope.row.userType === 'BUYER'" type="primary">采购方</el-tag>
            <el-tag v-else type="info">日常购买</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="性别" prop="sex"></el-table-column>
        <el-table-column label="电话" prop="phone"></el-table-column>
        <el-table-column label="邮箱" prop="email"></el-table-column>
        <el-table-column label="操作" align="center" width="160">
          <template #default="scope">
            <el-button type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card">
      <el-pagination background layout="prev, pager, next" v-model:page-size="data.pageSize" v-model:current-page="data.pageNum" :total="data.total" @current-change="load"/>
    </div>

    <!-- 用户表单内容较多，弹窗按视口限制高度，表单区域滚动，避免底部按钮在小屏幕被截断。 -->
    <el-dialog
        title="信息"
        width="min(640px, calc(100vw - 32px))"
        v-model="data.formVisible"
        class="user-form-dialog"
        modal-class="user-form-overlay"
        append-to-body
        align-center
        :close-on-click-modal="false"
        destroy-on-close>
      <el-form :model="data.form" label-width="100px" class="user-dialog-form">
        <el-form-item label="头像" prop="avatar">
          <el-upload :action="uploadUrl" list-type="picture" :on-success="handleImgSuccess">
            <el-button type="primary">上传图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="data.form.username" autocomplete="off" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="data.form.sex">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="data.form.phone" autocomplete="off" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="data.form.email" autocomplete="off" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="data.form.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="用户身份" prop="userType">
          <el-select v-model="data.form.userType" placeholder="请选择用户身份" style="width: 100%">
            <el-option label="采购方" value="BUYER" />
            <el-option label="供应方" value="SUPPLIER" />
            <el-option label="日常购买" value="SHOPPER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
      <span class="dialog-footer user-dialog-footer">
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
  pageNum: 1,
  pageSize: 10,
  total: 0,
  formVisible: false,
  form: {},
  tableData: [],
  name: null
})

// 普通用户信息管理页：管理员在这里维护普通用户账号，并通过分页查看用户列表。
const load = () => {
  // Element Plus 分页只会修改当前页码，必须重新请求后端分页接口才能刷新表格内容。
  request.get('/user/selectPage', {
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

// 查询条件变化时从第一页开始查，避免当前停留在后续页导致看不到符合条件的数据。
const search = () => {
  data.pageNum = 1
  load()
}

// 新增
const handleAdd = () => {
  data.form = { userType: 'SHOPPER' }
  data.formVisible = true
}

// 编辑
const handleEdit = (row) => {
  data.form = JSON.parse(JSON.stringify(row))
  data.formVisible = true
}

// 新增保存
const add = () => {
  request.post('/user/add', data.form).then(res => {
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
  request.put('/user/update', data.form).then(res => {
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
    request.delete('/user/delete/' + id).then(res => {
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
  data.pageNum = 1
  load()
}

// 处理文件上传的钩子
const handleImgSuccess = (res) => {
  data.form.avatar = res.data  // res.data就是文件上传返回的文件路径，获取到路径后赋值表单的属性
}

load()
</script>

<style scoped>
.user-dialog-form {
  padding-right: 10px;
}

.user-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Element Plus 弹窗挂载到 body 后，用全局选择器让弹窗始终在视口内显示并保持表单可滚动。 */
:global(.user-form-overlay .el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
}

:global(.user-form-dialog) {
  margin: 0 !important;
  max-height: calc(100vh - 48px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 78px rgba(13, 48, 24, .28);
}

:global(.user-form-dialog .el-dialog__header) {
  flex: 0 0 auto;
  padding: 20px 28px 14px;
  margin-right: 0;
  border-bottom: 1px solid #e6eedf;
}

:global(.user-form-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
}

:global(.user-form-dialog .el-dialog__footer) {
  flex: 0 0 auto;
  padding: 14px 28px 18px;
  border-top: 1px solid #e6eedf;
  background: rgba(255, 255, 255, .96);
}

:global(.user-form-dialog .el-dialog__body::-webkit-scrollbar) {
  width: 8px;
}

:global(.user-form-dialog .el-dialog__body::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  background: rgba(63, 139, 55, .28);
}

:global(.user-form-dialog .el-dialog__body::-webkit-scrollbar-track) {
  background: transparent;
}
</style>
