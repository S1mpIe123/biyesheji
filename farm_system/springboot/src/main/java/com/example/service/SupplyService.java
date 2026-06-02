package com.example.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.ObjectUtil;
import com.example.entity.Goods;
import com.example.entity.PurchaseDemand;
import com.example.entity.Supply;
import com.example.exception.CustomException;
import com.example.mapper.PurchaseDemandMapper;
import com.example.mapper.SupplyMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 农产品供应信息业务处理
 */
@Service
public class SupplyService {

    @Resource
    private SupplyMapper supplyMapper;
    @Resource
    private GoodsService goodsService;
    @Resource
    private PurchaseDemandMapper purchaseDemandMapper;

    /**
     * 新增供应信息。供应数量是后续产销对接和商城日常购买共用的源头库存。
     */
    public void add(Supply supply) {
        checkDemandConflict(supply);
        fillDefaultValue(supply);
        supplyMapper.insert(supply);
        syncGoodsWhenApproved(supply);
    }

    /**
     * 删除供应信息时只删除供应记录，不主动删除已上架商品，避免误删历史订单关联商品。
     */
    public void deleteById(Integer id) {
        supplyMapper.deleteById(id);
    }

    /**
     * 修改供应信息。审核通过后自动把供应信息同步为商城商品，便于“日常购买”直接购买。
     */
    public void updateById(Supply supply) {
        checkDemandConflict(supply);
        fillDefaultValue(supply);
        supplyMapper.updateById(supply);
        syncGoodsWhenApproved(supply);
    }

    /**
     * 日常购买扣减商品库存后，同步扣减来源供应信息的剩余数量。
     */
    public void reduceQuantity(Integer supplyId, Integer num) {
        if (supplyId == null || num == null || num <= 0) {
            return;
        }
        Supply supply = supplyMapper.selectById(supplyId);
        if (supply == null) {
            throw new CustomException("供应信息不存在");
        }
        int quantity = (supply.getQuantity() == null ? 0 : supply.getQuantity()) - num;
        if (quantity < 0) {
            throw new CustomException("供应剩余库存不足");
        }
        supply.setQuantity(quantity);
        supplyMapper.updateById(supply);
        syncGoodsStore(supply);
    }

    /**
     * 订单取消时返还来源供应信息的剩余数量。
     */
    public void restoreQuantity(Integer supplyId, Integer num) {
        if (supplyId == null || num == null || num <= 0) {
            return;
        }
        Supply supply = supplyMapper.selectById(supplyId);
        if (supply != null) {
            supply.setQuantity((supply.getQuantity() == null ? 0 : supply.getQuantity()) + num);
            supplyMapper.updateById(supply);
            syncGoodsStore(supply);
        }
    }

    public Supply selectById(Integer id) {
        return supplyMapper.selectById(id);
    }

    public List<Supply> selectAll(Supply supply) {
        return supplyMapper.selectAll(supply);
    }

    public PageInfo<Supply> selectPage(Supply supply, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Supply> list = supplyMapper.selectAll(supply);
        return PageInfo.of(list);
    }

    private void fillDefaultValue(Supply supply) {
        boolean isNew = supply.getId() == null;
        if (ObjectUtil.isEmpty(supply.getStatus())) {
            supply.setStatus("待审核");
        }
        if (ObjectUtil.isEmpty(supply.getUnit())) {
            supply.setUnit("斤");
        }
        // 供应端允许录入“吨”，但库存统一折算成“斤”存储，方便商城日常购买直接扣减。
        if ("吨".equals(supply.getUnit())) {
            supply.setQuantity((supply.getQuantity() == null ? 0 : supply.getQuantity()) * 2000);
            if (supply.getTotalQuantity() != null) {
                supply.setTotalQuantity(supply.getTotalQuantity() * 2000);
            }
            supply.setUnit("斤");
        }
        if (isNew || supply.getTotalQuantity() == null || supply.getTotalQuantity() <= 0) {
            supply.setTotalQuantity(supply.getQuantity());
        }
        if (ObjectUtil.isEmpty(supply.getCreateTime())) {
            supply.setCreateTime(DateUtil.now());
        }
    }

    /**
     * 同一用户不能一边采购某个品种，一边供应同一品种，避免角色切换后出现自买自卖。
     */
    private void checkDemandConflict(Supply supply) {
        if (supply.getSupplierId() == null || ObjectUtil.isEmpty(supply.getProductName())) {
            return;
        }
        PurchaseDemand query = new PurchaseDemand();
        query.setBuyerId(supply.getSupplierId());
        List<PurchaseDemand> list = purchaseDemandMapper.selectAll(query);
        boolean exists = list.stream().anyMatch(item -> sameProduct(item.getProductName(), supply.getProductName()));
        if (exists) {
            throw new CustomException("你曾以采购商身份发布过该农产品采购需求，不能再供应同一品种");
        }
    }

    private boolean sameProduct(String a, String b) {
        return !ObjectUtil.isEmpty(a) && !ObjectUtil.isEmpty(b) && a.trim().equals(b.trim());
    }
    /**
     * 审核通过后自动创建或更新对应的商城商品记录，同步商品名称、图片、价格、库存等信息
     */
    private void syncGoodsWhenApproved(Supply supply) {
        if (!"已通过".equals(supply.getStatus())) {
            return;
        }
        Goods goods = goodsService.selectBySourceSupplyId(supply.getId());
        if (goods == null) {
            goods = new Goods();
            goods.setSourceSupplyId(supply.getId());
            goods.setName(supply.getProductName());
            goods.setImg(supply.getImg());
            goods.setDescr(buildGoodsDescr(supply));
            goods.setSpecials("产销对接直供");
            goods.setPrice(supply.getPrice());
            goods.setUnit(supply.getUnit());
            goods.setStore(supply.getQuantity());
            goods.setCategoryId(supply.getCategoryId());
            goodsService.add(goods);
        } else {
            goods.setName(supply.getProductName());
            goods.setImg(supply.getImg());
            goods.setDescr(buildGoodsDescr(supply));
            goods.setSpecials("产销对接直供");
            goods.setPrice(supply.getPrice());
            goods.setUnit(supply.getUnit());
            goods.setStore(supply.getQuantity());
            goods.setCategoryId(supply.getCategoryId());
            goods.setSourceSupplyId(supply.getId());
            goodsService.updateById(goods);
        }
    }

    private String buildGoodsDescr(Supply supply) {
        String province = ObjectUtil.isEmpty(supply.getOriginProvince()) ? "" : supply.getOriginProvince();
        String place = ObjectUtil.isEmpty(supply.getOriginPlace()) ? "" : supply.getOriginPlace();
        return "供应方直供，产地：" + province + place + "，上市时间：" + supply.getAvailableTime();
    }

    private void syncGoodsStore(Supply supply) {
        Goods goods = goodsService.selectBySourceSupplyId(supply.getId());
        if (goods != null) {
            goods.setStore(supply.getQuantity());
            goods.setUnit(supply.getUnit());
            goodsService.updateById(goods);
        }
    }
}
