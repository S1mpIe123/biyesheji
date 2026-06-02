package com.example.entity;

public class Orders {
    private Integer id;
    private String orderNo;
    private Integer goodsId;
    private Integer num;
    private Integer userId;
    private String status;
    private String time;
    // 订单创建时保存商品快照，避免商品被修改或删除后订单列表名称、图片变空。
    private String goodsName;
    private String goodsImg;
    // 来源供应信息：为空表示管理员维护的普通商城商品，不为空表示供货商直供商品。
    private Integer sourceSupplyId;
    private Integer supplierId;
    private String supplierName;
    // 当前操作人信息只用于后端校验订单状态流转权限，不写入 orders 表。
    private Integer operatorId;
    private String operatorRole;
    // 软删除标记：1 表示在订单管理页面隐藏，保留历史数据和库存流转记录。
    private Integer deleted;

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getGoodsImg() {
        return goodsImg;
    }

    public void setGoodsImg(String goodsImg) {
        this.goodsImg = goodsImg;
    }

    public String getGoodsName() {
        return goodsName;
    }

    public void setGoodsName(String goodsName) {
        this.goodsName = goodsName;
    }

    public Integer getDeleted() {
        return deleted;
    }

    public void setDeleted(Integer deleted) {
        this.deleted = deleted;
    }

    public Integer getSourceSupplyId() {
        return sourceSupplyId;
    }

    public void setSourceSupplyId(Integer sourceSupplyId) {
        this.sourceSupplyId = sourceSupplyId;
    }

    public Integer getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Integer supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public Integer getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Integer operatorId) {
        this.operatorId = operatorId;
    }

    public String getOperatorRole() {
        return operatorRole;
    }

    public void setOperatorRole(String operatorRole) {
        this.operatorRole = operatorRole;
    }

    private String userName;


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public Integer getGoodsId() {
        return goodsId;
    }

    public void setGoodsId(Integer goodsId) {
        this.goodsId = goodsId;
    }

    public Integer getNum() {
        return num;
    }

    public void setNum(Integer num) {
        this.num = num;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }
}
