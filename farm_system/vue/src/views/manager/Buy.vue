
<template>
  <div class="card page-title-panel">
    <div>
      <div class="page-title">农产品购买</div>
      <div class="page-subtitle">浏览审核通过的农产品商品，观察库存与供应信息同步效果</div>
    </div>
    <div class="page-title-icon"><el-icon><Goods /></el-icon></div>
  </div>

  <div class="card category-bar">
    <el-button :class="{ 'active': data.activeCategoryId === null}" @click="loadCategoryGoods(null)">全部</el-button>
    <el-button :class="{ 'active': data.activeCategoryId === item.id}" @click="loadCategoryGoods(item.id)" v-for="item in data.categoryList" :key="item.id">{{ item.name }}</el-button>
  </div>
  <div class="card page-toolbar">
    <el-input style="width: 300px; margin-right: 5px" v-model="data.name" placeholder="请输入农产品名称关键字查询"></el-input>
    <el-button type="primary" @click="searchGoods">查询</el-button>
    <el-button type="info" style="margin: 0 10px" @click="reset">重置</el-button>
    <el-button :type="data.sortPrice === 'asc' ? 'success' : 'default'" @click="sortByPriceAsc">价格由低到高</el-button>
  </div>

  <el-row :gutter="14" v-if="data.total > 0">
    <el-col style="margin-bottom: 10px" :span="6" v-for="item in data.goodsList" :key="item.id">
      <div class="card goods-card">
        <img class="goods-img" :src="getGoodsImg(item)" alt="" @error="handleImgError($event, item)">
        <div class="goods-name">{{ item.name }}</div>
        <el-tooltip v-if="item.descr && item.descr.length > 40" :content="item.descr" effect="light" placement="top">
          <div class="line2" style="margin: 5px 0; color: #666; font-size: 14px; height: 40px">{{item.descr}}</div>
        </el-tooltip>
        <div v-else class="line2" style="margin: 5px 0; color: #666; font-size: 14px; height: 40px">{{item.descr}}</div>
        <div style="margin: 8px 0">
          <el-tag type="success">{{ item.specials }}</el-tag>
          <el-tag v-if="item.sourceSupplyId" class="supplier-tag" type="warning">{{ item.supplierName || '供货商' }}处理订单</el-tag>
        </div>
        <div class="goods-meta">
          <div class="goods-price">
            <strong>￥{{ item.price }}</strong>/{{ item.unit }}
          </div>
          <div class="goods-store">
            库存：{{ item.store }}
          </div>
          <div>
            <el-input-number @change="handleBut(item)" v-model="item.num" style="width: 120px" :min="0" :max="getBuyLimit(item)"></el-input-number>
          </div>
        </div>
        <div class="buy-line" v-if="item.num > 0">
          总价：<strong style="margin-right: 5px; display: inline-block; min-width: 50px; font-size: 18px; color: red">￥{{item.total}}</strong>
          <el-button type="primary" @click="buy(item)">购买</el-button>
        </div>
      </div>
    </el-col>
  </el-row>
  <div style="padding: 50px 0; text-align: center; font-size: 24px; color: #888" v-else>暂无农产品</div>
  <div class="card" v-if="data.total > 0">
    <el-pagination
        background
        layout="prev, pager, next"
        v-model:page-size="data.pageSize"
        v-model:current-page="data.pageNum"
        :total="data.total"
        @current-change="load"
    />
  </div>



</template>

<script setup>
  import { reactive, watch } from "vue";
  import { useRoute } from "vue-router";
  import request from "@/utils/request";
  import {ElMessage} from "element-plus";

  const route = useRoute()

  const data = reactive({
    user: JSON.parse(localStorage.getItem('system-user') || '{}'),
    categoryList: [],
    pageNum: 1,
    pageSize: 10,
    total: 0,
    goodsList: [],
    name: route.query.keyword || '',
    activeCategoryId: null,   //当前选定的分类Id
    sortPrice: ''
  })

  const defaultImgMap = {
    '番茄': 'http://localhost:9090/files/download/product-tomato.png',
    '大米': 'http://localhost:9090/files/download/product-rice.png',
    '白菜': 'http://localhost:9090/files/download/product-cabbage.png',
    '黄瓜': 'http://localhost:9090/files/download/product-cucumber.png',
    '苹果': 'http://localhost:9090/files/download/product-apple.png',
    '猕猴桃': 'http://localhost:9090/files/download/product-kiwi.png',
    '西瓜': 'http://localhost:9090/files/download/product-watermelon.png',
    '玉米': 'http://localhost:9090/files/download/product-corn.png',
    '土豆': 'http://localhost:9090/files/download/product-potato.png',
    '花生': 'http://localhost:9090/files/download/product-peanut.png',
    '辣椒': 'http://localhost:9090/files/download/product-chili.png',
    '小米辣': 'http://localhost:9090/files/download/product-chili.png',
    '苦瓜': 'http://localhost:9090/files/download/product-bittergourd.png',
    '香蕉': 'http://localhost:9090/files/download/product-banana.png',
    '火龙果': 'http://localhost:9090/files/download/product-dragonfruit.png',
    '小米': 'http://localhost:9090/files/download/product-millet.png'
  }

  const defaultGoodsImg = 'http://localhost:9090/files/download/product-vegetables.png'


  // 购买
  const buy = (goods) => {
      if (goods.unit === '斤' && goods.num > 100) {
        ElMessage.warning('单次最多购买100斤')
        return
      }
      let orderData = {
        userId: data.user.id,
        goodsId: goods.id,
        num: goods.num
      }
      request.post('/orders/add', orderData).then(res => {
        if (res.code === '200') {
          ElMessage.success('购买成功')
          load()
        } else {
          ElMessage.error(res.msg)
        }
      })
  }


  // 分页查询
  const load = () => {
    request.get('/goods/selectPage', {
      params: {
        pageNum: data.pageNum,
        pageSize: data.pageSize,
        name: data.name,
        categoryId: data.activeCategoryId,
        sortPrice: data.sortPrice
      }
    }).then(res => {
      data.goodsList = res.data?.list || []
      data.total = res.data?.total || 0
      data.goodsList.forEach(item => {
        item.num = 0
      })
    })
  }

  // 顶部搜索跳转到本页时，自动按关键词查询农产品。
  watch(() => route.query.keyword, (keyword) => {
    data.name = keyword || ''
    data.pageNum = 1
    load()
  })

  const searchGoods = () => {
    data.pageNum = 1
    load()
  }

  const sortByPriceAsc = () => {
    data.sortPrice = 'asc'
    data.pageNum = 1
    load()
  }

  const handleBut = (goods) => {
    goods.total = (goods.price * goods.num).toFixed(2)  //保留两位小数，计算总价
  }

  // 审核通过的供应会同步为“斤”单位商品，日常购买单次最多允许 100 斤。
  const getBuyLimit = (goods) => {
    const store = goods.store || 0
    if (goods.unit === '斤') {
      return Math.min(100, store)
    }
    return store
  }

  // 演示数据里如果商品图片为空，按商品名称给出兜底图片，避免购买页出现破图。
  const getGoodsImg = (goods) => {
    if (goods.img) {
      return goods.img
    }
    return defaultImgMap[goods.name] || defaultGoodsImg
  }

  const handleImgError = (event, goods) => {
    const fallback = defaultImgMap[goods.name] || defaultGoodsImg
    if (event.target.src !== fallback) {
      event.target.src = fallback
    }
  }

  // 获取到分类的数据
  request.get('/category/selectAll').then(res => {
    data.categoryList = res.data || []
  })


  const loadCategoryGoods = (categoryId) => {
    data.activeCategoryId = categoryId
    data.pageNum = 1
    load()
  }

  // 重置
  const reset = () => {
    data.name = ''
    data.activeCategoryId = null
    data.sortPrice = ''
    data.pageNum = 1
    load()
  }

  load()

</script>

<style scoped>
.active {
  color: white !important;
  background-color: #176b24;
}
.category-bar {
  margin-bottom: 12px;
}
.goods-card {
  padding: 12px;
  transition: transform .18s ease, box-shadow .18s ease;
}
.goods-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(39, 84, 52, .12);
}
.goods-img {
  width: 100%;
  height: 240px;
  border-radius: 8px;
  object-fit: cover;
  background: #f3f7f1;
}
.goods-name {
  font-size: 18px;
  font-weight: 800;
  margin: 10px 0 6px;
  color: #263238;
}
.goods-meta {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7a66;
}
.goods-price {
  flex: 1;
}
.goods-price strong {
  color: #d8392b;
  font-size: 20px;
}
.goods-store {
  min-width: 70px;
  text-align: center;
}
.supplier-tag {
  margin-left: 8px;
}
.buy-line {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #edf2ea;
}
</style>
