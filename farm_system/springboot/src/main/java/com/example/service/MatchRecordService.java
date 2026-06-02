package com.example.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.ObjectUtil;
import com.example.entity.MatchRecord;
import com.example.entity.PurchaseDemand;
import com.example.entity.Supply;
import com.example.exception.CustomException;
import com.example.mapper.MatchRecordMapper;
import com.example.mapper.PurchaseDemandMapper;
import com.example.mapper.SupplyMapper;
import com.example.utils.UnitConverter;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * 供需撮合记录业务处理
 */
@Service
public class MatchRecordService {

    @Resource
    private MatchRecordMapper matchRecordMapper;
    @Resource
    private SupplyService supplyService;
    @Resource
    private PurchaseDemandService purchaseDemandService;
    @Resource
    private SupplyMapper supplyMapper;
    @Resource
    private PurchaseDemandMapper purchaseDemandMapper;

    /**
     * 新增供需撮合记录。unit 记录本次对接使用的计量单位，避免后续供应/需求单位变更影响历史记录。
     */
    public void add(MatchRecord matchRecord) {
        checkSelfProductConflict(matchRecord);
        if (ObjectUtil.isEmpty(matchRecord.getStatus())) {
            matchRecord.setStatus("待确认");
        }
        if (ObjectUtil.isEmpty(matchRecord.getUnit())) {
            matchRecord.setUnit("斤");
        }
        matchRecord.setDeleted(0);
        matchRecord.setCreateTime(DateUtil.now());
        matchRecordMapper.insert(matchRecord);
    }

    /**
     * 同一用户不能对接自己曾经以另一身份发布的同品种农产品，避免自我供应/自我采购。
     */
    private void checkSelfProductConflict(MatchRecord matchRecord) {
        if (matchRecord.getResponseUserId() == null) {
            return;
        }
        Supply supply = matchRecord.getSupplyId() == null ? null : supplyMapper.selectById(matchRecord.getSupplyId());
        PurchaseDemand demand = matchRecord.getDemandId() == null ? null : purchaseDemandMapper.selectById(matchRecord.getDemandId());

        if (supply != null && demand != null) {
            checkPairedRecommendationConflict(matchRecord.getResponseUserId(), supply, demand);
            return;
        }
        if (supply != null && hasOwnSupply(matchRecord.getResponseUserId(), supply.getProductName())) {
            throw new CustomException("你曾以供应商身份发布过该农产品，不能再采购同一品种");
        }
        if (demand != null && hasOwnDemand(matchRecord.getResponseUserId(), demand.getProductName())) {
            throw new CustomException("你曾以采购商身份发布过该农产品需求，不能再供应同一品种");
        }
    }

    /**
     * 智能匹配会同时携带 supplyId 和 demandId：采购商是在用自己的需求匹配他人供应，
     * 供应商是在用自己的供应匹配他人需求，所以只能校验“另一身份”的同品种冲突。
     */
    private void checkPairedRecommendationConflict(Integer responseUserId, Supply supply, PurchaseDemand demand) {
        if (responseUserId.equals(supply.getSupplierId()) && responseUserId.equals(demand.getBuyerId())) {
            throw new CustomException("不能对接自己发布的供需信息");
        }
        if (responseUserId.equals(demand.getBuyerId())) {
            if (hasOwnSupply(responseUserId, demand.getProductName())) {
                throw new CustomException("你曾以供应商身份发布过该农产品，不能再采购同一品种");
            }
            return;
        }
        if (responseUserId.equals(supply.getSupplierId())) {
            if (hasOwnDemand(responseUserId, supply.getProductName())) {
                throw new CustomException("你曾以采购商身份发布过该农产品需求，不能再供应同一品种");
            }
            return;
        }
        if (hasOwnSupply(responseUserId, demand.getProductName())) {
            throw new CustomException("你曾以供应商身份发布过该农产品，不能再采购同一品种");
        }
        if (hasOwnDemand(responseUserId, supply.getProductName())) {
            throw new CustomException("你曾以采购商身份发布过该农产品需求，不能再供应同一品种");
        }
    }

    private boolean hasOwnSupply(Integer userId, String productName) {
        Supply query = new Supply();
        query.setSupplierId(userId);
        return supplyMapper.selectAll(query).stream().anyMatch(item -> sameProduct(item.getProductName(), productName));
    }

    private boolean hasOwnDemand(Integer userId, String productName) {
        PurchaseDemand query = new PurchaseDemand();
        query.setBuyerId(userId);
        return purchaseDemandMapper.selectAll(query).stream().anyMatch(item -> sameProduct(item.getProductName(), productName));
    }

    private boolean sameProduct(String a, String b) {
        return !ObjectUtil.isEmpty(a) && !ObjectUtil.isEmpty(b) && a.trim().equals(b.trim());
    }

    /**
     * 隐藏撮合记录。这里不物理删除，避免已确认记录的库存变动缺少历史依据。
     */
    public void deleteById(Integer id) {
        matchRecordMapper.deleteById(id);
    }

    @Transactional
    public void updateById(MatchRecord matchRecord) {
        MatchRecord dbRecord = matchRecordMapper.selectById(matchRecord.getId());
        if (dbRecord != null && shouldLockStock(dbRecord.getStatus(), matchRecord.getStatus())) {
            supplyService.reduceQuantity(dbRecord.getSupplyId(), getNormalizedQuantity(dbRecord));
            purchaseDemandService.reduceQuantity(dbRecord.getDemandId(), getNormalizedQuantity(dbRecord));
        }
        if (dbRecord != null && shouldRestoreStock(dbRecord.getStatus(), matchRecord.getStatus())) {
            supplyService.restoreQuantity(dbRecord.getSupplyId(), getNormalizedQuantity(dbRecord));
            purchaseDemandService.restoreQuantity(dbRecord.getDemandId(), getNormalizedQuantity(dbRecord));
        }
        matchRecordMapper.updateById(matchRecord);
    }

    /**
     * 从待确认/已拒绝进入成交履约状态时锁定供需数量，避免同一批货物被重复成交。
     */
    private boolean shouldLockStock(String oldStatus, String newStatus) {
        return !isStockLockedStatus(oldStatus) && isStockLockedStatus(newStatus);
    }

    /**
     * 未完成前取消或退回非成交状态才释放库存；已完成或售后阶段代表货物已经到货，不再回补供应数量。
     */
    private boolean shouldRestoreStock(String oldStatus, String newStatus) {
        return isStockLockedStatus(oldStatus) && !isStockLockedStatus(newStatus) && !isFinishedStatus(oldStatus);
    }

    /**
     * 已确认后的支付、发货、收货、售后都属于同一笔成交履约流程，库存应持续锁定。
     */
    private boolean isStockLockedStatus(String status) {
        return Arrays.asList("已确认", "已支付", "待发货", "待收货", "已完成", "售后中", "售后已处理").contains(status);
    }

    /**
     * 确认到货之后的状态不允许再通过取消来回补库存，避免历史成交反向污染剩余库存。
     */
    private boolean isFinishedStatus(String status) {
        return Arrays.asList("已完成", "售后中", "售后已处理").contains(status);
    }

    private Integer getNormalizedQuantity(MatchRecord matchRecord) {
        return UnitConverter.toStockQuantity(matchRecord.getQuantity(), matchRecord.getUnit());
    }

    public MatchRecord selectById(Integer id) {
        return matchRecordMapper.selectById(id);
    }

    public List<MatchRecord> selectAll(MatchRecord matchRecord) {
        return matchRecordMapper.selectAll(matchRecord);
    }

    public PageInfo<MatchRecord> selectPage(MatchRecord matchRecord, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<MatchRecord> list = matchRecordMapper.selectAll(matchRecord);
        return PageInfo.of(list);
    }
}
