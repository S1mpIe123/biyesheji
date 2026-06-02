<template>
  <div class="login-container">
    <NatureDynamicBackground theme="auth" />
    <div class="auth-shell">
      <div class="auth-form-panel">
        <div class="auth-brand">
          <img src="@/assets/imgs/logo.png" alt="">
          <span>AgriLink</span>
        </div>
        <div class="auth-title">欢迎登录</div>
        <div class="auth-subtitle">进入农产品产销对接平台，查看供需发布、智能匹配与订单闭环。</div>
      <el-form :model="data.form"  ref="formRef" :rules="data.rules">
        <el-form-item prop="username">
          <el-input :prefix-icon="User" size="large" v-model="data.form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input :prefix-icon="Lock" size="large" v-model="data.form.password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item prop="role">
          <el-select size="large" style="width: 100%" v-model="data.form.role">
            <el-option value="USER" label="普通用户"></el-option>
            <el-option value="ADMIN" label="管理员"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button class="auth-submit" size="large" type="primary" style="width: 100%" @click="login">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="auth-link">
        还没有账号？请 <a href="/register">注册</a>
      </div>
      </div>

      <div class="auth-preview">
        <div class="preview-card">
          <div class="preview-top">
            <span>产销对接态势</span>
            <em>Live</em>
          </div>
          <div class="preview-photo">
            <div class="preview-glass">
              <div>
                <span>今日活跃产地</span>
                <strong>8</strong>
              </div>
              <div>
                <span>待撮合货源</span>
                <strong>36</strong>
              </div>
            </div>
            <div class="preview-route">
              <span>供应发布</span>
              <i></i>
              <span>智能匹配</span>
              <i></i>
              <span>采购确认</span>
            </div>
          </div>
          <div class="preview-stats">
            <div><strong>82%</strong><span>匹配效率</span></div>
            <div><strong>12</strong><span>今日订单</span></div>
            <div><strong>36</strong><span>活跃供需</span></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
  import { reactive, ref } from "vue";
  import { User, Lock } from "@element-plus/icons-vue";
  import request from "@/utils/request";
  import {ElMessage} from "element-plus";
  import router from "@/router";
  import NatureDynamicBackground from "@/components/NatureDynamicBackground.vue";

  const data = reactive({
    form: { role: 'USER' },
    rules: {
      username: [
        { required: true, message: '请输入账号', trigger: 'blur' },
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
      ],
    }
  })

  const formRef = ref()

  // 点击登录按钮的时候会触发这个方法
  const login = () => {
    formRef.value.validate((valid => {
      if (valid) {
        // 调用后台的接口
        request.post('/login', data.form).then(res => {
          if (res.code === '200') {
            ElMessage.success("登录成功")
            router.push('/')
            localStorage.setItem('system-user', JSON.stringify(res.data))
          } else {
            ElMessage.error(res.msg)
          }
        })
      }
    })).catch(error => {
      console.error(error)
    })
  }

</script>

<style scoped>
.login-container {
  height: 100vh;
  overflow:hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1d5226;
  position: relative;
}
.auth-shell {
  width: min(1180px, calc(100vw - 80px));
  min-height: 640px;
  display: grid;
  grid-template-columns: 46% 54%;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 34px 90px rgba(10, 40, 18, .36);
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(18px) saturate(1.08);
}
.auth-form-panel {
  padding: 76px 76px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 44px;
  color: #1a1c32;
  font-size: 28px;
  font-weight: 800;
}
.auth-brand img {
  width: 38px;
  height: 38px;
}
.auth-title {
  font-size: 42px;
  font-weight: 900;
  color: #111;
  margin-bottom: 10px;
  letter-spacing: 0;
}
.auth-subtitle {
  color: #777;
  line-height: 24px;
  margin-bottom: 32px;
}
.auth-submit {
  background: linear-gradient(180deg, #263326 0%, #1a1c32 100%);
  border: none;
  box-shadow: 0 14px 26px rgba(17, 17, 17, .18);
}
.auth-link {
  text-align: right;
  color: #777;
}
.auth-preview {
  background:
      radial-gradient(circle at 82% 15%, rgba(255, 255, 255, .34), transparent 30%),
      linear-gradient(145deg, #49c90d 0%, #158b07 66%, #0d5f26 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 54px;
}
.auth-preview::after {
  content: "";
  position: absolute;
  inset: auto -60px -80px -60px;
  height: 210px;
  background: linear-gradient(0deg, rgba(255,255,255,.34), transparent);
}
.auth-preview::before {
  content: "";
  position: absolute;
  inset: 22px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 24px;
  pointer-events: none;
}
.preview-card {
  width: min(620px, 100%);
  min-height: 460px;
  background: rgba(255,255,255,.9);
  border-radius: 24px;
  padding: 34px;
  box-shadow: 0 18px 60px rgba(0,0,0,.18);
  position: relative;
  z-index: 1;
  overflow: hidden;
  backdrop-filter: blur(12px);
}
.preview-top {
  display: flex;
  justify-content: space-between;
  font-size: 22px;
  font-weight: 800;
}
.preview-top em {
  font-size: 12px;
  font-style: normal;
  color: #fff;
  background: #2fc10a;
  border-radius: 14px;
  padding: 4px 10px;
}
.preview-photo {
  height: 286px;
  margin: 24px 0;
  border-radius: 20px;
  background:
      linear-gradient(180deg, rgba(15, 66, 21, .1), rgba(15, 66, 21, .46)),
      url("@/assets/imgs/bg.png") center/cover;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.35);
}
.preview-photo::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,255,.55), transparent 36%, rgba(255,255,255,.1));
}
.preview-glass {
  position: absolute;
  left: 22px;
  top: 22px;
  display: flex;
  gap: 12px;
  z-index: 1;
}
.preview-glass div {
  min-width: 120px;
  padding: 12px 14px;
  border-radius: 14px;
  color: #fff;
  background: rgba(17, 50, 21, .5);
  backdrop-filter: blur(8px);
}
.preview-glass span,
.preview-glass strong {
  display: block;
}
.preview-glass span {
  opacity: .82;
  font-size: 12px;
}
.preview-glass strong {
  margin-top: 4px;
  font-size: 28px;
}
.preview-route {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 24px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}
.preview-route span {
  border-radius: 999px;
  padding: 8px 12px;
  color: #fff;
  background: rgba(15, 42, 17, .72);
  backdrop-filter: blur(8px);
}
.preview-route i {
  flex: 1;
  height: 1px;
  margin: 0 10px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent);
}
.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.preview-stats div {
  background: #f5f7f4;
  border-radius: 14px;
  padding: 16px;
}
.preview-stats strong {
  display: block;
  font-size: 30px;
  color: #111;
}
.preview-stats span {
  color: #777;
}
@media (max-width: 980px) {
  .auth-shell {
    width: min(520px, calc(100vw - 32px));
    min-height: auto;
    grid-template-columns: 1fr;
  }
  .auth-form-panel {
    padding: 42px 34px;
  }
  .auth-preview {
    display: none;
  }
  .auth-title {
    font-size: 32px;
  }
}
</style>
