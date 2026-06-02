package com.example.utils;

import cn.hutool.core.util.ObjectUtil;
import com.example.exception.CustomException;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 农产品计量单位换算工具。
 * 系统库存统一按“斤”进行业务扣减和回滚，页面仍可以展示斤、吨、个等用户输入单位。
 */
public class UnitConverter {

    private static final BigDecimal JIN_PER_TON = new BigDecimal("2000");

    private UnitConverter() {
    }

    /**
     * 将用户提交的数量转换为库存扣减使用的“斤”。
     * “个”无法与重量互转，仍按原数量处理，适合鸡蛋、水果礼盒等按件交易的场景。
     */
    public static Integer toStockQuantity(Integer quantity, String unit) {
        if (quantity == null) {
            return 0;
        }
        if (quantity < 0) {
            throw new CustomException("数量不能小于0");
        }
        if (ObjectUtil.isEmpty(unit) || "斤".equals(unit) || "个".equals(unit)) {
            return quantity;
        }
        if ("吨".equals(unit)) {
            return new BigDecimal(quantity).multiply(JIN_PER_TON).setScale(0, RoundingMode.HALF_UP).intValue();
        }
        throw new CustomException("暂不支持的计量单位：" + unit);
    }

    /**
     * 金额类字段统一使用 BigDecimal 保留两位小数，避免 float/double 带来的精度误差。
     */
    public static BigDecimal money(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
