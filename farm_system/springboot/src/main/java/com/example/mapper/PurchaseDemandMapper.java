package com.example.mapper;

import com.example.entity.PurchaseDemand;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 操作采购需求相关数据接口
 */
public interface PurchaseDemandMapper {

    int insert(PurchaseDemand purchaseDemand);

    @Delete("delete from purchase_demand where id = #{id}")
    int deleteById(Integer id);

    int updateById(PurchaseDemand purchaseDemand);

    @Select("select * from purchase_demand where id = #{id}")
    PurchaseDemand selectById(Integer id);

    List<PurchaseDemand> selectAll(PurchaseDemand purchaseDemand);
}
