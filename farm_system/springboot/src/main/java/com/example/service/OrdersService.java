package com.example.service;


import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.IdUtil;
import com.example.entity.Goods;
import com.example.entity.Orders;
import com.example.entity.Supply;
import com.example.entity.User;
import com.example.exception.CustomException;
import com.example.mapper.OrdersMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 农产品购买订单业务处理
 **/
@Service
public class OrdersService {

    @Resource
    private OrdersMapper ordersMapper;
    @Resource
    private GoodsService goodsService;
    @Resource
    private SupplyService supplyService;
    @Resource
    private UserService userService;

    /**
     * 新增
     */
    @Transactional
    public void add(Orders orders) {
        User user = userService.selectById(orders.getUserId());
        if (user != null && "SUPPLIER".equals(user.getUserType())) {
            throw new CustomException("供应商只能进行产品供应，不能进行日常购买");
        }
        orders.setOrderNo(IdUtil.fastSimpleUUID());  //确保唯一订单编号
        orders.setTime(DateUtil.now());  //设置订单时间
        orders.setStatus("待支付");


        //扣库存
        Goods goods = goodsService.selectById(orders.getGoodsId());
        if(goods == null){
            throw new RuntimeException("商品不存在！");  //抛出异常
        }
        if ("斤".equals(goods.getUnit()) && orders.getNum() != null && orders.getNum() > 100) {
            throw new CustomException("农产品购买单次最多购买100斤");
        }
        // 保存下单时的商品名称和图片快照，后续商品信息调整也不影响历史订单展示。
        orders.setGoodsName(goods.getName());
        orders.setGoodsImg(goods.getImg());
        orders.setDeleted(0);
        int store = goods.getStore() - orders.getNum();  //扣库存
        if(store < 0){
            throw new RuntimeException("库存不足！");  //抛出异常
        }
        goods.setStore(store);  //设置库存
        goodsService.updateById(goods);
        // 如果商品来自审核通过的供应信息，日常购买也要同步扣减供应剩余量。
        supplyService.reduceQuantity(goods.getSourceSupplyId(), orders.getNum());
        ordersMapper.insert(orders);
    }

    /**
     * 隐藏订单
     */
    public void deleteById(Integer id) {
        // 订单删除采用软删除，只在列表中隐藏，避免破坏订单流水和库存追溯。
        ordersMapper.hideById(id);
    }

    /**
     * 修改
     */
    @Transactional
    public void updateById(Orders orders) {
        Orders dbOrder = ordersMapper.selectById(orders.getId());
        if (dbOrder == null) {
            throw new CustomException("订单不存在");
        }
        checkStatusOperator(dbOrder, orders);
        // 下单时已经锁定库存；只有未完成订单第一次取消时才返还库存，已完成订单取消不回补库存。
        if(shouldRestoreStockOnCancel(dbOrder.getStatus(), orders.getStatus())){  // 若用户取消未完成订单，那么要返还库存
            Integer goodsId = dbOrder.getGoodsId();
            Goods goods = goodsService.selectById(goodsId);
            if (goods != null){
                goods.setStore(goods.getStore() + dbOrder.getNum());
                goodsService.updateById(goods);
                // 取消订单时同步返还供应信息库存，保证供应大厅显示的剩余量实时准确。
                supplyService.restoreQuantity(goods.getSourceSupplyId(), dbOrder.getNum());
            }
        }
        ordersMapper.updateById(orders);
    }

    /**
     * 商城小额订单的动作边界：
     * 下单人负责支付、取消和确认收货；直供商品的对应供货商负责发货；平台商品由管理员发货。
     */
    private void checkStatusOperator(Orders dbOrder, Orders requestOrder) {
        Integer operatorId = requestOrder.getOperatorId() == null ? requestOrder.getUserId() : requestOrder.getOperatorId();
        if (operatorId == null) {
            return;
        }
        String oldStatus = dbOrder.getStatus();
        String newStatus = requestOrder.getStatus();
        if (oldStatus == null || oldStatus.equals(newStatus)) {
            return;
        }
        boolean buyerAction = "待发货".equals(newStatus) || "已取消".equals(newStatus) || "已完成".equals(newStatus);
        if (buyerAction && !operatorId.equals(dbOrder.getUserId())) {
            throw new CustomException("只有下单人可以支付、取消或确认收货");
        }
        if ("待收货".equals(newStatus)) {
            checkShipOperator(dbOrder, requestOrder, operatorId);
        }
    }

    private void checkShipOperator(Orders dbOrder, Orders requestOrder, Integer operatorId) {
        Goods goods = goodsService.selectById(dbOrder.getGoodsId());
        if (goods == null) {
            throw new CustomException("商品不存在");
        }
        if (goods.getSourceSupplyId() == null) {
            // 平台商品没有具体供货商，只允许管理员侧发货。
            if (!"ADMIN".equals(requestOrder.getOperatorRole())) {
                throw new CustomException("平台商品只能由管理员发货");
            }
            return;
        }
        Supply supply = supplyService.selectById(goods.getSourceSupplyId());
        if (supply == null || !operatorId.equals(supply.getSupplierId())) {
            throw new CustomException("只有该直供商品的供货商可以发货");
        }
    }

    /**
     * 订单库存规则：待支付/待发货/待收货取消会释放库存；已完成说明货物已确认到货，取消只改变状态不再回补库存。
     */
    private boolean shouldRestoreStockOnCancel(String oldStatus, String newStatus) {
        return !"已取消".equals(oldStatus) && !"已完成".equals(oldStatus) && "已取消".equals(newStatus);
    }

    /**
     * 根据ID查询
     */
    public Orders selectById(Integer id) {
        return ordersMapper.selectById(id);
    }

    /**
     * 查询所有
     */
    public List<Orders> selectAll(Orders orders) {
        return ordersMapper.selectAll(orders);
    }

    /**
     * 分页查询
     */
    public PageInfo<Orders> selectPage(Orders orders, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Orders> list = ordersMapper.selectAll(orders);
        return PageInfo.of(list);
    }


}
