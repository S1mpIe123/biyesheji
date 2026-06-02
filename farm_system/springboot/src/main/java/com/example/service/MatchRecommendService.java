package com.example.service;

import cn.hutool.core.util.ObjectUtil;
import com.example.entity.MatchRecommend;
import com.example.entity.PurchaseDemand;
import com.example.entity.Supply;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

/**
 * 智能匹配推荐服务。
 * 算法采用“农产品名称优先”的规则：只有名称一致或相近才进入推荐，品类只作为辅助加分。
 */
@Service
public class MatchRecommendService {

    private static final List<String> PRODUCT_KEYWORDS = Arrays.asList(
            "猕猴桃", "西红柿", "马铃薯", "红薯", "地瓜", "土豆", "苹果", "香蕉", "西瓜", "黄瓜",
            "番茄", "白菜", "花生", "玉米", "大米", "稻米", "葡萄", "水蜜桃", "梨", "桃",
            "橙", "橘", "柑", "辣椒", "茄子", "萝卜", "芹菜", "菠菜", "油菜"
    );
    private static final List<String> VARIETY_KEYWORDS = Arrays.asList(
            "红富士", "富士", "冰糖心", "嘎啦", "乔纳金", "皇冠", "绿心", "徐香", "麒麟", "黑美人", "甜玉米", "糯玉米"
    );
    private static final List<String> NAME_NOISE_WORDS = Arrays.asList(
            "我爱吃", "求购", "供应", "采购", "出售", "新鲜", "优质", "精品", "大量", "批发", "现货"
    );

    @Resource
    private SupplyService supplyService;
    @Resource
    private PurchaseDemandService purchaseDemandService;

    public List<MatchRecommend> recommendSupplyForBuyer(Integer buyerId) {
        PurchaseDemand query = new PurchaseDemand();
        query.setBuyerId(buyerId);
        query.setStatus("已通过");
        List<PurchaseDemand> demands = purchaseDemandService.selectAll(query);

        Supply supplyQuery = new Supply();
        supplyQuery.setStatus("已通过");
        List<Supply> supplies = supplyService.selectAll(supplyQuery);

        List<MatchRecommend> result = new ArrayList<>();
        for (PurchaseDemand demand : demands) {
            for (Supply supply : supplies) {
                if (supply.getQuantity() != null && supply.getQuantity() <= 0) {
                    continue;
                }
                MatchRecommend recommend = buildRecommend(supply, demand);
                if (recommend.getScore() >= 60) {
                    result.add(recommend);
                }
            }
        }
        result.sort(Comparator.comparing(MatchRecommend::getScore).reversed());
        return result;
    }

    public List<MatchRecommend> recommendDemandForSupplier(Integer supplierId) {
        Supply query = new Supply();
        query.setSupplierId(supplierId);
        query.setStatus("已通过");
        List<Supply> supplies = supplyService.selectAll(query);

        PurchaseDemand demandQuery = new PurchaseDemand();
        demandQuery.setStatus("已通过");
        List<PurchaseDemand> demands = purchaseDemandService.selectAll(demandQuery);

        List<MatchRecommend> result = new ArrayList<>();
        for (Supply supply : supplies) {
            for (PurchaseDemand demand : demands) {
                if (demand.getQuantity() != null && demand.getQuantity() <= 0) {
                    continue;
                }
                MatchRecommend recommend = buildRecommend(supply, demand);
                if (recommend.getScore() >= 60) {
                    result.add(recommend);
                }
            }
        }
        result.sort(Comparator.comparing(MatchRecommend::getScore).reversed());
        return result;
    }
    //用来进行推荐匹配的算法（贴标签）
    private MatchRecommend buildRecommend(Supply supply, PurchaseDemand demand) {
        List<String> reasons = new ArrayList<>();
        int score = 0;

        int nameScore = calcNameScore(supply.getProductName(), demand.getProductName());
        if (nameScore == 0) {
            return buildUnmatchedRecommend(supply, demand);
        }
        score += nameScore;
        reasons.add(nameScore >= 45 ? "农产品一致或品种相近" : "农产品名称相近");

        int categoryScore = sameCategory(supply, demand) ? 10 : 0;
        if (categoryScore > 0) {
            score += categoryScore;
            reasons.add("分类匹配");
        }

        int timeScore = calcTimeScore(supply.getAvailableTime(), demand.getDeadline());
        score += timeScore;
        if (timeScore > 0) {
            reasons.add("供需时间接近");
        }

        int priceScore = calcPriceScore(supply.getPrice(), demand.getExpectedPrice());
        score += priceScore;
        if (priceScore > 0) {
            reasons.add("价格符合预期");
        }

        int areaScore = calcAreaScore(supply.getOriginProvince(), demand.getReceiveArea());
        score += areaScore;
        if (areaScore > 0) {
            reasons.add("产地与收货地匹配");
        }

        int quantityScore = calcQuantityScore(supply.getQuantity(), demand.getQuantity());
        score += quantityScore;
        if (quantityScore > 0) {
            reasons.add("数量匹配");
        }

        MatchRecommend recommend = new MatchRecommend();
        recommend.setSupplyId(supply.getId());
        recommend.setDemandId(demand.getId());
        recommend.setProductName(ObjectUtil.isEmpty(supply.getProductName()) ? demand.getProductName() : supply.getProductName());
        recommend.setSupplyName(supply.getProductName());
        recommend.setDemandName(demand.getProductName());
        recommend.setSupplierName(supply.getSupplierName());
        recommend.setBuyerName(demand.getBuyerName());
        recommend.setOriginProvince(supply.getOriginProvince());
        recommend.setReceiveArea(demand.getReceiveArea());
        recommend.setAvailableTime(supply.getAvailableTime());
        recommend.setDeadline(demand.getDeadline());
        recommend.setQuantity(Math.min(supply.getQuantity() == null ? 0 : supply.getQuantity(), demand.getQuantity() == null ? 0 : demand.getQuantity()));
        recommend.setUnit(ObjectUtil.isEmpty(supply.getUnit()) ? demand.getUnit() : supply.getUnit());
        recommend.setSupplyPrice(supply.getPrice());
        recommend.setExpectedPrice(demand.getExpectedPrice());
        recommend.setScore(Math.min(score, 100));
        recommend.setReason(String.join("、", reasons));
        recommend.setNameScore(nameScore);
        recommend.setCategoryScore(categoryScore);
        recommend.setTimeScore(timeScore);
        recommend.setPriceScore(priceScore);
        recommend.setAreaScore(areaScore);
        recommend.setQuantityScore(quantityScore);
        return recommend;
    }

    /**
     * 名称不匹配时直接返回 0 分结果，由外层阈值过滤，避免白菜和番茄只因同类目被推荐。
     */
    private MatchRecommend buildUnmatchedRecommend(Supply supply, PurchaseDemand demand) {
        MatchRecommend recommend = new MatchRecommend();
        recommend.setSupplyId(supply.getId());
        recommend.setDemandId(demand.getId());
        recommend.setProductName(ObjectUtil.isEmpty(supply.getProductName()) ? demand.getProductName() : supply.getProductName());
        recommend.setSupplyName(supply.getProductName());
        recommend.setDemandName(demand.getProductName());
        recommend.setOriginProvince(supply.getOriginProvince());
        recommend.setReceiveArea(demand.getReceiveArea());
        recommend.setAvailableTime(supply.getAvailableTime());
        recommend.setDeadline(demand.getDeadline());
        recommend.setQuantity(0);
        recommend.setUnit(ObjectUtil.isEmpty(supply.getUnit()) ? demand.getUnit() : supply.getUnit());
        recommend.setSupplyPrice(supply.getPrice());
        recommend.setExpectedPrice(demand.getExpectedPrice());
        recommend.setScore(0);
        recommend.setReason("农产品名称不匹配");
        recommend.setNameScore(0);
        recommend.setCategoryScore(0);
        recommend.setTimeScore(0);
        recommend.setPriceScore(0);
        recommend.setAreaScore(0);
        recommend.setQuantityScore(0);
        return recommend;
    }
    //分类匹配
    private boolean sameCategory(Supply supply, PurchaseDemand demand) {
        return supply.getCategoryId() != null && supply.getCategoryId().equals(demand.getCategoryId());
    }
    //名称匹配
    private int calcNameScore(String supplyName, String demandName) {
        if (ObjectUtil.isEmpty(supplyName) || ObjectUtil.isEmpty(demandName)) {
            return 0;
        }
        String supply = normalizeName(supplyName);
        String demand = normalizeName(demandName);
        if (supply.equals(demand)) {
            return 50;
        }
        String supplyProduct = extractKeyword(supply, PRODUCT_KEYWORDS);
        String demandProduct = extractKeyword(demand, PRODUCT_KEYWORDS);
        String supplyVariety = extractKeyword(supply, VARIETY_KEYWORDS);
        String demandVariety = extractKeyword(demand, VARIETY_KEYWORDS);

        // 名称包含关系通常说明一个名称只是另一个名称增加了产地、等级等修饰词。
        if (supply.contains(demand) || demand.contains(supply)) {
            return 45;
        }

        // 农产品匹配先看核心品类，再看品种词。例如“烟台富士苹果”和“红富士苹果”都属于苹果且富士品种相近。
        if (!ObjectUtil.isEmpty(supplyProduct) && supplyProduct.equals(demandProduct)) {
            if (isSimilarVariety(supplyVariety, demandVariety)) {
                return 48;
            }
            return 35;
        }

        // 品种词相近但品类词未识别时，给中等分，避免词库不足导致可对接货源完全丢失。
        if (isSimilarVariety(supplyVariety, demandVariety)) {
            return 35;
        }
        return commonCharCount(supply, demand) >= 2 ? 25 : 0;
    }
    //通用名称匹配
    private String normalizeName(String name) {
        String normalized = name.trim();
        for (String word : NAME_NOISE_WORDS) {
            normalized = normalized.replace(word, "");
        }
        return normalized.trim();
    }
    //额外关键字匹配
    private String extractKeyword(String name, List<String> keywords) {
        for (String keyword : keywords) {
            if (name.contains(keyword)) {
                return keyword;
            }
        }
        return "";
    }
    //是否为同类修饰词产品
    private boolean isSimilarVariety(String supplyVariety, String demandVariety) {
        if (ObjectUtil.isEmpty(supplyVariety) || ObjectUtil.isEmpty(demandVariety)) {
            return false;
        }
        return supplyVariety.equals(demandVariety) || supplyVariety.contains(demandVariety) || demandVariety.contains(supplyVariety);
    }
    //相同点计数
    private int commonCharCount(String supplyName, String demandName) {
        int count = 0;
        for (int i = 0; i < supplyName.length(); i++) {
            if (demandName.indexOf(supplyName.charAt(i)) >= 0) {
                count++;
            }
        }
        return count;
    }
    //时间匹配
    private int calcTimeScore(String availableTime, String deadline) {
        try {
            if (ObjectUtil.isEmpty(availableTime) || ObjectUtil.isEmpty(deadline)) {
                return 0;
            }
            long days = Math.abs(ChronoUnit.DAYS.between(LocalDate.parse(availableTime), LocalDate.parse(deadline)));
            if (days <= 7) {
                return 20;
            }
            if (days <= 30) {
                return 10;
            }
        } catch (Exception ignored) {
        }
        return 0;
    }
    //价格匹配
    private int calcPriceScore(BigDecimal supplyPrice, BigDecimal expectedPrice) {
        if (supplyPrice == null || expectedPrice == null) {
            return 0;
        }
        if (supplyPrice.compareTo(expectedPrice) <= 0) {
            return 15;
        }
        if (supplyPrice.subtract(expectedPrice).compareTo(expectedPrice.multiply(new BigDecimal("0.2"))) <= 0) {
            return 8;
        }
        return 0;
    }
    //区域匹配
    private int calcAreaScore(String originProvince, String receiveArea) {
        if (ObjectUtil.isEmpty(originProvince) || ObjectUtil.isEmpty(receiveArea)) {
            return 0;
        }
        return receiveArea.contains(originProvince) ? 15 : 5;
    }
    //数量匹配
    private int calcQuantityScore(Integer supplyQuantity, Integer demandQuantity) {
        if (supplyQuantity == null || demandQuantity == null || supplyQuantity <= 0 || demandQuantity <= 0) {
            return 0;
        }
        return supplyQuantity >= demandQuantity ? 10 : 5;
    }
}
