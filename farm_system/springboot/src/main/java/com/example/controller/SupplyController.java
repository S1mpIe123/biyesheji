package com.example.controller;

import com.example.common.Result;
import com.example.entity.Supply;
import com.example.service.SupplyService;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 农产品供应信息前端操作接口
 */
@RestController
@RequestMapping("/supply")
public class SupplyController {

    @Resource
    private SupplyService supplyService;

    @PostMapping("/add")
    public Result add(@RequestBody Supply supply) {
        supplyService.add(supply);
        return Result.success();
    }

    @DeleteMapping("/delete/{id}")
    public Result deleteById(@PathVariable Integer id) {
        supplyService.deleteById(id);
        return Result.success();
    }

    @PutMapping("/update")
    public Result updateById(@RequestBody Supply supply) {
        supplyService.updateById(supply);
        return Result.success();
    }

    @GetMapping("/selectById/{id}")
    public Result selectById(@PathVariable Integer id) {
        Supply supply = supplyService.selectById(id);
        return Result.success(supply);
    }

    @GetMapping("/selectAll")
    public Result selectAll(Supply supply) {
        List<Supply> list = supplyService.selectAll(supply);
        return Result.success(list);
    }

    @GetMapping("/selectPage")
    public Result selectPage(Supply supply,
                             @RequestParam(defaultValue = "1") Integer pageNum,
                             @RequestParam(defaultValue = "10") Integer pageSize) {
        PageInfo<Supply> page = supplyService.selectPage(supply, pageNum, pageSize);
        return Result.success(page);
    }
}
