package com.example.entity;

import java.math.BigDecimal;

/**
 * 智能匹配推荐结果，用于向供应商/采购商解释推荐分数和推荐原因。
 */
public class MatchRecommend {
    private Integer supplyId;
    private Integer demandId;
    private String productName;
    private String supplyName;
    private String demandName;
    private String supplierName;
    private String buyerName;
    private String originProvince;
    private String receiveArea;
    private String availableTime;
    private String deadline;
    private Integer quantity;
    private String unit;
    private BigDecimal supplyPrice;
    private BigDecimal expectedPrice;
    private Integer score;
    private String reason;
    // 分项评分用于前端透明展示推荐算法，答辩时可以说明不是黑盒推荐。
    private Integer nameScore;
    private Integer categoryScore;
    private Integer timeScore;
    private Integer priceScore;
    private Integer areaScore;
    private Integer quantityScore;

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

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getSupplyName() {
        return supplyName;
    }

    public void setSupplyName(String supplyName) {
        this.supplyName = supplyName;
    }

    public String getDemandName() {
        return demandName;
    }

    public void setDemandName(String demandName) {
        this.demandName = demandName;
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

    public String getOriginProvince() {
        return originProvince;
    }

    public void setOriginProvince(String originProvince) {
        this.originProvince = originProvince;
    }

    public String getReceiveArea() {
        return receiveArea;
    }

    public void setReceiveArea(String receiveArea) {
        this.receiveArea = receiveArea;
    }

    public String getAvailableTime() {
        return availableTime;
    }

    public void setAvailableTime(String availableTime) {
        this.availableTime = availableTime;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
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

    public BigDecimal getSupplyPrice() {
        return supplyPrice;
    }

    public void setSupplyPrice(BigDecimal supplyPrice) {
        this.supplyPrice = supplyPrice;
    }

    public BigDecimal getExpectedPrice() {
        return expectedPrice;
    }

    public void setExpectedPrice(BigDecimal expectedPrice) {
        this.expectedPrice = expectedPrice;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getNameScore() {
        return nameScore;
    }

    public void setNameScore(Integer nameScore) {
        this.nameScore = nameScore;
    }

    public Integer getCategoryScore() {
        return categoryScore;
    }

    public void setCategoryScore(Integer categoryScore) {
        this.categoryScore = categoryScore;
    }

    public Integer getTimeScore() {
        return timeScore;
    }

    public void setTimeScore(Integer timeScore) {
        this.timeScore = timeScore;
    }

    public Integer getPriceScore() {
        return priceScore;
    }

    public void setPriceScore(Integer priceScore) {
        this.priceScore = priceScore;
    }

    public Integer getAreaScore() {
        return areaScore;
    }

    public void setAreaScore(Integer areaScore) {
        this.areaScore = areaScore;
    }

    public Integer getQuantityScore() {
        return quantityScore;
    }

    public void setQuantityScore(Integer quantityScore) {
        this.quantityScore = quantityScore;
    }
}
