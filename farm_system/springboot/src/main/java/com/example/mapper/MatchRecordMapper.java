package com.example.mapper;

import com.example.entity.MatchRecord;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 操作供需撮合记录相关数据接口
 */
public interface MatchRecordMapper {

    int insert(MatchRecord matchRecord);

    @Update("update match_record set status = '已隐藏' where id = #{id}")
    int deleteById(Integer id);

    int updateById(MatchRecord matchRecord);

    @Select("select match_record.*, match_record.delivery_address as deliveryAddress from match_record where id = #{id}")
    MatchRecord selectById(Integer id);

    List<MatchRecord> selectAll(MatchRecord matchRecord);
}
