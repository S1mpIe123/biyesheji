<template>
  <div class="login-container">
    <NatureDynamicBackground theme="auth" />
    <div class="auth-shell">
      <div class="auth-form-panel">
        <div class="auth-brand">
          <img src="@/assets/imgs/logo.png" alt="">
          <span>AgriLink</span>
        </div>
        <div class="auth-title">创建账号</div>
        <div class="auth-subtitle">选择你的业务身份，进入供应发布、采购对接或日常购买流程。</div>
      <el-form :model="data.form"  ref="formRef" :rules="data.rules">
        <el-form-item prop="username">
          <el-input :prefix-icon="User" size="large" v-model="data.form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input :prefix-icon="Lock" size="large" v-model="data.form.password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input :prefix-icon="Lock" size="large" v-model="data.form.confirmPassword" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item prop="userType">
          <el-select size="large" style="width: 100%" v-model="data.form.userType" placeholder="请选择账号身份">
            <el-option value="BUYER" label="采购方"></el-option>
            <el-option value="SUPPLIER" label="供应方"></el-option>
            <el-option value="SHOPPER" label="日常购买"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button class="auth-submit" size="large" type="primary" style="width: 100%" @click="register">注 册</el-button>
        </el-form-item>
      </el-form>
      <div class="auth-link">
        已有账号？请 <a href="/login">登录</a>
      </div>
      </div>

      <div class="auth-preview">
        <div class="preview-card">
          <div class="preview-top">
            <span>{{ selectedIdentity.previewTitle }}</span>
            <em>{{ selectedIdentity.badge }}</em>
          </div>
          <div class="identity-grid">
            <div
                class="identity-card"
                v-for="item in identityOptions"
                :key="item.value"
                :class="{ active: data.form.userType === item.value }"
                @click="selectIdentity(item.value)">
              <strong>{{ item.label }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </div>
          <div class="preview-copy">{{ selectedIdentity.previewDesc }}</div>
          <div class="preview-flow">
            <template v-for="(step, index) in selectedIdentity.flow" :key="step">
              <div :class="{ current: index === selectedIdentity.activeStep }">{{ step }}</div>
              <span v-if="index < selectedIdentity.flow.length - 1"></span>
            </template>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
  import { computed, reactive, ref } from "vue";
  import { User, Lock } from "@element-plus/icons-vue";
  import request from "@/utils/request";
  import {ElMessage} from "element-plus";
  import router from "@/router";
  import NatureDynamicBackground from "@/components/NatureDynamicBackground.vue";

  const validatePass = (rule, value, callback) => {
    if (!value) {
      callback(new Error('请确认密码'))
    } else if (value !== data.form.password) {
      callback(new Error('两次输入密码不一致'))
    } else {
      callback()
    }
  }

  const data = reactive({
    form: { role: 'USER', userType: 'SHOPPER' },
    rules: {
      username: [
        { required: true, message: '请输入账号', trigger: 'blur' },
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
      ],
      confirmPassword: [
        { validator: validatePass, trigger: 'blur' },
      ],
      userType: [
        { required: true, message: '请选择账号身份', trigger: 'change' },
      ],
    }
  })

  // 注册身份配置集中维护，左侧下拉和右侧预览共用同一份身份语义，避免展示内容不同步。
  const identityOptions = [
    {
      value: 'SUPPLIER',
      label: '供应方',
      desc: '发布农产品供应',
      previewTitle: '供应发布工作台',
      previewDesc: '适合农户、合作社或供货商，注册后可发布货源、等待采购匹配并处理发货履约。',
      badge: 'Supply',
      flow: ['注册身份', '发布货源', '智能匹配', '发货履约'],
      activeStep: 1
    },
    {
      value: 'BUYER',
      label: '采购方',
      desc: '发布采购意向',
      previewTitle: '采购对接工作台',
      previewDesc: '适合企业、团购或批量采购用户，注册后可发布采购需求并查看智能推荐货源。',
      badge: 'Demand',
      flow: ['注册身份', '发布需求', '匹配供应', '确认采购'],
      activeStep: 1
    },
    {
      value: 'SHOPPER',
      label: '日常购买',
      desc: '进入商城下单',
      previewTitle: '日常购买入口',
      previewDesc: '适合普通消费者，注册后可直接进入农产品购买页面，完成小额购买和收货确认。',
      badge: 'Shop',
      flow: ['注册身份', '浏览商品', '下单支付', '确认收货'],
      activeStep: 2
    }
  ]

  // 根据当前选择实时驱动右侧模块，高亮卡片、标题说明和流程节点都会同步变化。
  const selectedIdentity = computed(() => {
    return identityOptions.find(item => item.value === data.form.userType) || identityOptions[2]
  })

  const selectIdentity = (value) => {
    data.form.userType = value
  }


  const formRef = ref()

  // 点击注册按钮的时候会触发这个方法
  const register = () => {
    formRef.value.validate((valid => {
      if (valid) {
        // 调用后台的接口
        request.post('/register', data.form).then(res => {
          if (res.code === '200') {
            ElMessage.success("注册成功")
            router.push('/login')
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
  min-height: 660px;
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
  padding: 58px 76px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 34px;
  color: #111;
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
}
.auth-subtitle {
  color: #777;
  line-height: 24px;
  margin-bottom: 28px;
}
.auth-submit {
  background: linear-gradient(180deg, #263326 0%, #111 100%);
  border: none;
  box-shadow: 0 14px 26px rgba(17, 17, 17, .18);
}
.auth-link {
  text-align: right;
  color: #777;
}
.auth-preview {
  background:
      radial-gradient(circle at 82% 15%, rgba(255,255,255,.3), transparent 30%),
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
  /* 预览模块保持内缩和完整圆角，避免白色卡片直接贴到右侧背景产生硬边界。 */
  width: min(620px, 100%);
  min-height: 430px;
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(255,255,255,.58);
  border-radius: 24px;
  padding: 34px;
  box-shadow: 0 18px 60px rgba(0,0,0,.18);
  position: relative;
  z-index: 1;
  overflow: hidden;
  backdrop-filter: blur(12px);
}
.preview-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
      linear-gradient(90deg, rgba(255,255,255,.22), transparent 32%),
      radial-gradient(circle at 92% 8%, rgba(47, 193, 10, .12), transparent 34%);
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
.identity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 36px 0;
}
.identity-card {
  min-height: 150px;
  border-radius: 18px;
  background: #f5f7f4;
  padding: 22px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform .22s ease, box-shadow .22s ease, background .22s ease, border-color .22s ease;
}
.identity-card.active {
  background: linear-gradient(180deg, #2fc10a 0%, #159008 100%);
  color: #fff;
  transform: translateY(-6px);
  border-color: rgba(255,255,255,.62);
  box-shadow: 0 20px 36px rgba(28, 150, 18, .28);
}
.identity-card:not(.active):hover {
  transform: translateY(-3px);
  border-color: rgba(47, 193, 10, .22);
  box-shadow: 0 14px 28px rgba(39, 84, 52, .08);
}
.identity-card strong {
  display: block;
  font-size: 26px;
  margin-bottom: 14px;
}
.identity-card span {
  color: inherit;
  opacity: .72;
}
.preview-copy {
  min-height: 52px;
  margin: -12px 0 24px;
  color: #5c6b5c;
  line-height: 24px;
  transition: color .2s ease;
}
.preview-flow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #111;
}
.preview-flow div {
  background: #fff;
  border-radius: 18px;
  padding: 10px 14px;
  box-shadow: 0 8px 18px rgba(0,0,0,.06);
  transition: color .2s ease, background .2s ease, box-shadow .2s ease, transform .2s ease;
}
.preview-flow div.current {
  color: #fff;
  background: linear-gradient(180deg, #2fc10a 0%, #159008 100%);
  box-shadow: 0 12px 22px rgba(28, 150, 18, .22);
  transform: translateY(-2px);
}
.preview-flow span {
  flex: 1;
  height: 2px;
  background: #39b80e;
}
@media (max-width: 980px) {
  .auth-shell {
    width: min(520px, calc(100vw - 32px));
    min-height: auto;
    grid-template-columns: 1fr;
  }
  .auth-form-panel {
    padding: 36px 34px;
  }
  .auth-preview {
    display: none;
  }
  .auth-title {
    font-size: 32px;
  }
}
</style>
