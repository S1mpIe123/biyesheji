package com.example.controller;

import com.example.common.Result;
import com.example.service.MatchRecommendService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 智能匹配推荐接口
 */
@RestController
@RequestMapping("/matchRecommend")
public class MatchRecommendController {

    @Resource
    private MatchRecommendService matchRecommendService;

    @GetMapping("/supplyForBuyer")
    public Result recommendSupplyForBuyer(@RequestParam Integer buyerId) {
        return Result.success(matchRecommendService.recommendSupplyForBuyer(buyerId));
    }

    @GetMapping("/demandForSupplier")
    public Result recommendDemandForSupplier(@RequestParam Integer supplierId) {
        return Result.success(matchRecommendService.recommendDemandForSupplier(supplierId));
    }
}
