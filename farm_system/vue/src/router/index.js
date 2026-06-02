import {createRouter, createWebHistory} from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/Manager.vue'),
      redirect: '/home',
      children: [
        { path: 'person', component: () => import('@/views/manager/Person.vue')},
        { path: 'password', component: () => import('@/views/manager/Password.vue')},
        { path: 'home', component: () => import('@/views/manager/Home.vue')},
        { path: 'admin', component: () => import('@/views/manager/Admin.vue')},
        { path: 'notice', component: () => import('@/views/manager/Notice.vue')},
        { path: 'category', component: () => import('@/views/manager/Category.vue')},
        { path: 'goods', component: () => import('@/views/manager/Goods.vue')},
        { path: 'user', component: () => import('@/views/manager/User.vue')},
        { path: 'buy', component: () => import('@/views/manager/Buy.vue')},
        { path: 'orders', component: () => import('@/views/manager/Orders.vue')},
        { path: 'messages', component: () => import('@/views/manager/Messages.vue')},
        { path: 'analysis', component: () => import('@/views/manager/Analysis.vue')},
        { path: 'goodsStock', component: () => import('@/views/manager/GoodsStock.vue')},
        { path: 'supplyHall', component: () => import('@/views/manager/SupplyHall.vue')},
        { path: 'demandHall', component: () => import('@/views/manager/DemandHall.vue')},
        { path: 'matchRecord', component: () => import('@/views/manager/MatchRecord.vue')},
        { path: 'matchRecommend', component: () => import('@/views/manager/MatchRecommend.vue')},
        { path: 'matchAudit', component: () => import('@/views/manager/MatchAudit.vue')},
      ]
    },
    { path: '/login', component: () => import('@/views/Login.vue')},
    { path: '/register', component: () => import('@/views/Register.vue')},
  ]
})

export default router
