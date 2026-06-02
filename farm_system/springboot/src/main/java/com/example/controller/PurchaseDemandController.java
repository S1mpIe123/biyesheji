package com.example.controller;

import com.example.common.Result;
import com.example.entity.PurchaseDemand;
import com.example.service.PurchaseDemandService;
import com.github.pagehelper.PageInfo;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 采购需求前端操作接口
 */
@RestController
@RequestMapping("/purchaseDemand")
public class PurchaseDemandController {

    @Resource
    private PurchaseDemandService purchaseDemandService;

    @PostMapping("/add")
    public Result add(@RequestBody PurchaseDemand purchaseDemand) {
        purchaseDemandService.add(purchaseDemand);
        return Result.success();
    }

    @DeleteMapping("/delete/{id}")
    public Result deleteById(@PathVariable Integer id) {
        purchaseDemandService.deleteById(id);
        return Result.success();
    }

    @PutMapping("/update")
    public Result updateById(@RequestBody PurchaseDemand purchaseDemand) {
        purchaseDemandService.updateById(purchaseDemand);
        return Result.success();
    }

    @GetMapping("/selectById/{id}")
    public Result selectById(@PathVariable Integer id) {
        PurchaseDemand purchaseDemand = purchaseDemandService.selectById(id);
        return Result.success(purchaseDemand);
    }

    @GetMapping("/selectAll")
    public Result selectAll(PurchaseDemand purchaseDemand) {
        List<PurchaseDemand> list = purchaseDemandService.selectAll(purchaseDemand);
        return Result.success(list);
    }

    @GetMapping("/selectPage")
    public Result selectPage(PurchaseDemand purchaseDemand,
                             @RequestParam(defaultValue = "1") Integer pageNum,
                             @RequestParam(defaultValue = "10") Integer pageSize) {
        PageInfo<PurchaseDemand> page = purchaseDemandService.selectPage(purchaseDemand, pageNum, pageSize);
        return Result.success(page);
    }
}
