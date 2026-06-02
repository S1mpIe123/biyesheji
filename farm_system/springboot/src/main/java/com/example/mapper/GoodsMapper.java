package com.example.mapper;

import com.example.entity.Goods;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 操作农产品分类相关数据接口
*/
public interface GoodsMapper {

    /**
      * 新增
    */
    int insert(Goods goods);

    /**
      * 删除
    */
    @Delete("delete from goods where id = #{id}")
    int deleteById(Integer id);

    /**
      * 修改
    */
    int updateById(Goods goods);

    /**
      * 根据ID查询
    */
    @Select("select * from goods where id = #{id}")
    Goods selectById(Integer id);

    /**
     * 根据供应信息ID查询对应上架商品，用于保持供应库存和日常购买库存同步。
     */
    @Select("select * from goods where source_supply_id = #{sourceSupplyId} limit 1")
    Goods selectBySourceSupplyId(Integer sourceSupplyId);

    /**
      * 查询所有
    */
    List<Goods> selectAll(Goods goods);


}
