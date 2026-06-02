package com.example.mapper;

import com.example.entity.Supply;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 操作农产品供应信息相关数据接口
 */
public interface SupplyMapper {

    int insert(Supply supply);

    @Delete("delete from supply where id = #{id}")
    int deleteById(Integer id);

    int updateById(Supply supply);

    @Select("select * from supply where id = #{id}")
    Supply selectById(Integer id);

    List<Supply> selectAll(Supply supply);
}
