package com.example.entity;

import java.math.BigDecimal;

/**
 * 供需撮合记录
 */
public class MatchRecord {
    private Integer id;
    private Integer supplyId;
    private Integer demandId;
    private Integer responseUserId;
    private Integer quantity;
    private String unit;
    private BigDecimal price;
    private String message;
    private String status;
    private String deliveryAddress;
    private String createTime;
    private String supplyProductName;
    private String demandProductName;
    private String productName;
    private String responseUserName;
    private String supplierName;
    private String buyerName;
    private Integer supplierId;
    private Integer buyerId;
    private Integer relatedUserId;
    // 软删除标记：删除撮合记录时只隐藏列表数据，保留库存扣减和历史追溯依据。
    private Integer deleted;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSupplyId() {
        return supplyId;
    }

    public void setSupplyId(Integer supplyId) {
        this.supplyId = supplyId;
    }

    public Integer getDemandId() {
        return demandId;
    }

    public void setDemandId(Integer demandId) {
        this.demandId = demandId;
    }

    public Integer getResponseUserId() {
        return responseUserId;
    }

    public void setResponseUserId(Integer responseUserId) {
        this.responseUserId = responseUserId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime;
    }

    public String getSupplyProductName() {
        return supplyProductName;
    }

    public void setSupplyProductName(String supplyProductName) {
        this.supplyProductName = supplyProductName;
    }

    public String getDemandProductName() {
        return demandProductName;
    }

    public void setDemandProductName(String demandProductName) {
        this.demandProductName = demandProductName;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getResponseUserName() {
        return responseUserName;
    }

    public void setResponseUserName(String responseUserName) {
        this.responseUserName = responseUserName;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public Integer getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Integer buyerId) {
        this.buyerId = buyerId;
    }

    public Integer getRelatedUserId() {
        return relatedUserId;
    }

    public void setRelatedUserId(Integer relatedUserId) {
        this.relatedUserId = relatedUserId;
    }

    public Integer getDeleted() {
        return deleted;
    }

    public void setDeleted(Integer deleted) {
        this.deleted = deleted;
    }
}
