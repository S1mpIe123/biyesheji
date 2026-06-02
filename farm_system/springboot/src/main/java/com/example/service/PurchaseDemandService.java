package com.example.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.ObjectUtil;
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
 * 采购需求业务处理
 */
@Service
public class PurchaseDemandService {

    @Resource
    private PurchaseDemandMapper purchaseDemandMapper;
    @Resource
    private SupplyMapper supplyMapper;

    /**
     * 新增采购需求。单位固定在“斤/吨”中选择，便于后续与供应信息对齐。
     */
    public void add(PurchaseDemand purchaseDemand) {
        if (ObjectUtil.isEmpty(purchaseDemand.getStatus())) {
            purchaseDemand.setStatus("待审核");
        }
        checkSupplyConflict(purchaseDemand);
        fillDefaultValue(purchaseDemand, true);
        purchaseDemand.setCreateTime(DateUtil.now());
        purchaseDemandMapper.insert(purchaseDemand);
    }

    public void deleteById(Integer id) {
        purchaseDemandMapper.deleteById(id);
    }

    public void updateById(PurchaseDemand purchaseDemand) {
        checkSupplyConflict(purchaseDemand);
        fillDefaultValue(purchaseDemand, false);
        purchaseDemandMapper.updateById(purchaseDemand);
    }

    /**
     * 确认供应商响应后扣减采购需求的剩余待采购量。
     */
    public void reduceQuantity(Integer demandId, Integer num) {
        if (demandId == null || num == null || num <= 0) {
            return;
        }
        PurchaseDemand demand = purchaseDemandMapper.selectById(demandId);
        if (demand == null) {
            return;
        }
        int quantity = (demand.getQuantity() == null ? 0 : demand.getQuantity()) - num;
        if (quantity < 0) {
            throw new RuntimeException("采购需求剩余待采购量不足");
        }
        demand.setQuantity(quantity);
        purchaseDemandMapper.updateById(demand);
    }

    /**
     * 撤销已确认的供货响应时，返还采购需求剩余待采购量。
     */
    public void restoreQuantity(Integer demandId, Integer num) {
        if (demandId == null || num == null || num <= 0) {
            return;
        }
        PurchaseDemand demand = purchaseDemandMapper.selectById(demandId);
        if (demand != null) {
            demand.setQuantity((demand.getQuantity() == null ? 0 : demand.getQuantity()) + num);
            purchaseDemandMapper.updateById(demand);
        }
    }

    private void fillDefaultValue(PurchaseDemand purchaseDemand, boolean isNew) {
        if (ObjectUtil.isEmpty(purchaseDemand.getUnit())) {
            purchaseDemand.setUnit("斤");
        }
        if ("吨".equals(purchaseDemand.getUnit())) {
            purchaseDemand.setQuantity((purchaseDemand.getQuantity() == null ? 0 : purchaseDemand.getQuantity()) * 2000);
            if (purchaseDemand.getTotalQuantity() != null) {
                purchaseDemand.setTotalQuantity(purchaseDemand.getTotalQuantity() * 2000);
            }
            purchaseDemand.setUnit("斤");
        }
        if (isNew || purchaseDemand.getTotalQuantity() == null || purchaseDemand.getTotalQuantity() <= 0) {
            purchaseDemand.setTotalQuantity(purchaseDemand.getQuantity());
        }
    }

    /**
     * 同一用户不能采购自己曾经供应的同一农产品品种，避免身份切换后形成自我对接。
     */
    private void checkSupplyConflict(PurchaseDemand purchaseDemand) {
        if (purchaseDemand.getBuyerId() == null || ObjectUtil.isEmpty(purchaseDemand.getProductName())) {
            return;
        }
        Supply query = new Supply();
        query.setSupplierId(purchaseDemand.getBuyerId());
        List<Supply> list = supplyMapper.selectAll(query);
        boolean exists = list.stream().anyMatch(item -> sameProduct(item.getProductName(), purchaseDemand.getProductName()));
        if (exists) {
            throw new CustomException("你曾以供应商身份发布过该农产品供应信息，不能再采购同一品种");
        }
    }

    private boolean sameProduct(String a, String b) {
        return !ObjectUtil.isEmpty(a) && !ObjectUtil.isEmpty(b) && a.trim().equals(b.trim());
    }

    public PurchaseDemand selectById(Integer id) {
        return purchaseDemandMapper.selectById(id);
    }

    public List<PurchaseDemand> selectAll(PurchaseDemand purchaseDemand) {
        return purchaseDemandMapper.selectAll(purchaseDemand);
    }

    public PageInfo<PurchaseDemand> selectPage(PurchaseDemand purchaseDemand, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<PurchaseDemand> list = purchaseDemandMapper.selectAll(purchaseDemand);
        return PageInfo.of(list);
    }
}
