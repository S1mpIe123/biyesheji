package com.example.controller;

import com.example.common.Result;
import com.example.entity.MatchRecord;
import com.example.service.MatchRecordService;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 供需撮合记录前端操作接口
 */
@RestController
@RequestMapping("/matchRecord")
public class MatchRecordController {

    @Resource
    private MatchRecordService matchRecordService;

    @PostMapping("/add")
    public Result add(@RequestBody MatchRecord matchRecord) {
        matchRecordService.add(matchRecord);
        return Result.success();
    }

    @DeleteMapping("/delete/{id}")
    public Result deleteById(@PathVariable Integer id) {
        matchRecordService.deleteById(id);
        return Result.success();
    }

    @PutMapping("/update")
    public Result updateById(@RequestBody MatchRecord matchRecord) {
        matchRecordService.updateById(matchRecord);
        return Result.success();
    }

    @GetMapping("/selectById/{id}")
    public Result selectById(@PathVariable Integer id) {
        MatchRecord matchRecord = matchRecordService.selectById(id);
        return Result.success(matchRecord);
    }

    @GetMapping("/selectAll")
    public Result selectAll(MatchRecord matchRecord) {
        List<MatchRecord> list = matchRecordService.selectAll(matchRecord);
        return Result.success(list);
    }

    @GetMapping("/selectPage")
    public Result selectPage(MatchRecord matchRecord,
                             @RequestParam(defaultValue = "1") Integer pageNum,
                             @RequestParam(defaultValue = "10") Integer pageSize) {
        PageInfo<MatchRecord> page = matchRecordService.selectPage(matchRecord, pageNum, pageSize);
        return Result.success(page);
    }
}
