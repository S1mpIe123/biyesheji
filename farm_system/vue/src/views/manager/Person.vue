<template>
  <div class="profile-page">
    <div class="card page-title-panel">
      <div>
        <div class="page-title">个人资料</div>
        <div class="page-subtitle">维护账号信息、切换业务身份，并在同一页面完成密码修改</div>
      </div>
      <div class="page-title-icon"><el-icon><User /></el-icon></div>
    </div>

    <div class="profile-layout">
      <div class="card profile-aside">
        <el-upload :show-file-list="false" class="avatar-uploader" :action="uploadUrl" :on-success="handleFileUpload">
          <img v-if="data.user.avatar" :src="data.user.avatar" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div class="profile-name">{{ data.user.name || data.user.username }}</div>
        <div class="profile-role">{{ getUserTypeText(data.user.userType || data.user.role) }}</div>
        <div class="profile-note">
          普通用户可在这里切换供应商、采购商、日常购买身份；切换后左侧菜单会同步调整。
        </div>
      </div>

      <div class="card profile-main">
        <el-tabs v-model="data.activeTab" class="profile-tabs">
          <el-tab-pane label="资料信息" name="info">
            <el-form :model="data.user" label-width="96px" class="profile-form">
              <el-form-item label="账号">
                <el-input disabled v-model="data.user.username" autocomplete="off" />
              </el-form-item>
              <el-form-item label="名称">
                <el-input v-model="data.user.name" autocomplete="off" />
              </el-form-item>
              <div v-if="data.user.role === 'USER'">
                <el-form-item label="性别" prop="sex">
                  <el-radio-group v-model="data.user.sex">
                    <el-radio label="男">男</el-radio>
                    <el-radio label="女">女</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="电话" prop="phone">
                  <el-input v-model="data.user.phone" autocomplete="off" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="data.user.email" autocomplete="off" />
                </el-form-item>
                <el-form-item label="用户身份" prop="userType">
                  <el-select v-model="data.user.userType" placeholder="请选择用户身份" style="width: 100%">
                    <el-option label="供应商" value="SUPPLIER" />
                    <el-option label="采购商" value="BUYER" />
                    <el-option label="日常购买" value="SHOPPER" />
                  </el-select>
                </el-form-item>
              </div>
              <div class="form-actions">
                <el-button type="primary" @click="save">保存资料</el-button>
              </div>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="修改密码" name="password">
            <el-form :model="data.passwordForm" label-width="96px" class="profile-form">
              <el-form-item label="原密码">
                <el-input show-password v-model="data.passwordForm.password" autocomplete="off" placeholder="请输入当前密码" />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input show-password v-model="data.passwordForm.newPassword" autocomplete="off" placeholder="请输入新密码" />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input show-password v-model="data.passwordForm.confirmPassword" autocomplete="off" placeholder="请再次输入新密码" />
              </el-form-item>
              <div class="password-tip">
                密码修改成功后需要重新登录，避免旧登录状态继续使用。
              </div>
              <div class="form-actions">
                <el-button type="primary" @click="savePassword">修改密码</el-button>
              </div>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import {reactive} from "vue"
import router from "@/router";
import request from "@/utils/request";
import {ElMessage} from "element-plus";

// 文件上传的接口地址
const uploadUrl = import.meta.env.VITE_BASE_URL + '/files/upload'

const data = reactive({
  user: JSON.parse(localStorage.getItem('system-user') || '{}'),
  activeTab: 'info',
  passwordForm: {
    password: '',
    newPassword: '',
    confirmPassword: ''
  }
})

const handleFileUpload = (file) => {
  data.user.avatar = file.data
}

const emit = defineEmits(["updateUser"])

const getUserTypeText = (value) => {
  const map = {
    ADMIN: '管理员',
    SUPPLIER: '供应商',
    BUYER: '采购商',
    SHOPPER: '日常购买'
  }
  return map[value] || '用户'
}

// 保存个人资料。普通用户可在此切换供应商、采购商、日常购买三种业务身份。
const save = () => {
  if (data.user.role === 'ADMIN') {
    request.put('/admin/update', data.user).then(res => {
      if (res.code === '200') {
        ElMessage.success('更新成功')
        localStorage.setItem('system-user', JSON.stringify(data.user))
        emit('updateUser')
      } else {
        ElMessage.error(res.msg)
      }
    })
  } else if (data.user.role === 'USER') {
    request.put('/user/update', data.user).then(res => {
      if (res.code === '200') {
        ElMessage.success('更新成功')
        localStorage.setItem('system-user', JSON.stringify(data.user))
        emit('updateUser')
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
}

// 密码修改合并到个人资料页，减少侧边栏冗余入口。
const savePassword = () => {
  if (!data.passwordForm.password || !data.passwordForm.newPassword || !data.passwordForm.confirmPassword) {
    ElMessage.warning('请完整填写密码信息')
    return
  }
  if (data.passwordForm.newPassword !== data.passwordForm.confirmPassword) {
    ElMessage.warning('两次新密码输入不一致')
    return
  }
  request.put('/updatePassword', {
    ...data.user,
    password: data.passwordForm.password,
    newPassword: data.passwordForm.newPassword
  }).then(res => {
    if (res.code === '200') {
      ElMessage.success('修改成功，请重新登录')
      localStorage.removeItem('system-user')
      router.push('/login')
    } else {
      ElMessage.error(res.msg)
    }
  })
}
</script>

<style scoped>
.profile-page {
  max-width: 1080px;
}
.profile-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
}
.profile-aside,
.profile-main {
  padding: 28px;
}
.profile-aside {
  text-align: center;
  background:
      linear-gradient(180deg, rgba(45, 189, 10, .12), rgba(255, 255, 255, .94)),
      rgba(255,255,255,.95);
}
.avatar-uploader {
  display: inline-block;
}
.avatar-uploader .avatar {
  width: 132px;
  height: 132px;
  display: block;
  object-fit: cover;
}
.profile-name {
  margin-top: 18px;
  color: #18251a;
  font-size: 22px;
  font-weight: 800;
}
.profile-role {
  display: inline-flex;
  margin-top: 10px;
  padding: 6px 14px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(180deg, #31bd0d 0%, #138d06 100%);
  box-shadow: 0 10px 24px rgba(28, 150, 18, .25);
}
.profile-note {
  margin-top: 22px;
  color: #667261;
  line-height: 24px;
  text-align: left;
}
.profile-form {
  max-width: 620px;
  padding-top: 12px;
}
.form-actions {
  padding-left: 96px;
  margin-top: 18px;
}
.password-tip {
  margin-left: 96px;
  margin-top: -2px;
  color: #7b8875;
  font-size: 13px;
}
@media (max-width: 900px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 132px;
  height: 132px;
  text-align: center;
}
</style>
