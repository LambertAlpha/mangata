/// Mangata Marketplace Module
///
/// 实现NFT交易的marketplace,使用共享对象模式
module mangata::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::String;
    use mangata::content_nft::ContentNFT;

    /// 错误码
    const E_NOT_LISTED: u64 = 0;
    const E_INSUFFICIENT_PAYMENT: u64 = 1;
    const E_NOT_SELLER: u64 = 2;

    /// Marketplace 共享对象
    public struct Marketplace has key {
        id: UID,
        /// 存储所有上架的NFT: nft_id -> Listing
        listings: Table<ID, Listing>,
    }

    /// 单个NFT的上架信息
    public struct Listing has store {
        /// NFT对象ID
        nft_id: ID,
        /// 卖家地址
        seller: address,
        /// 售价 (MIST)
        price: u64,
        /// 上架时的NFT对象(托管在这里)
        nft: ContentNFT,
    }

    /// 上架事件
    public struct NFTListed has copy, drop {
        nft_id: ID,
        seller: address,
        price: u64,
        // 添加NFT元数据到事件,避免前端查询对象
        blob_id: String,
        title: String,
        description: String,
        preview_url: String,
        content_type: String,
        created_at: u64,
    }

    /// 下架事件
    public struct NFTDelisted has copy, drop {
        nft_id: ID,
        seller: address,
    }

    /// 购买事件
    public struct NFTPurchased has copy, drop {
        nft_id: ID,
        buyer: address,
        seller: address,
        price: u64,
    }

    /// 初始化函数 - 创建共享的Marketplace
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            listings: table::new(ctx),
        };

        // 将marketplace设为共享对象,任何人都可以访问
        transfer::share_object(marketplace);
    }

    /// 上架NFT到marketplace
    ///
    /// @param marketplace - 共享的marketplace对象
    /// @param nft - 要上架的NFT
    /// @param price - 售价 (MIST)
    /// @param ctx - 交易上下文
    public entry fun list_nft(
        marketplace: &mut Marketplace,
        nft: ContentNFT,
        price: u64,
        ctx: &mut TxContext
    ) {
        use mangata::content_nft;

        let seller = tx_context::sender(ctx);
        let nft_id = object::id(&nft);

        // 在添加到listing之前,先读取NFT的元数据
        let blob_id = content_nft::get_blob_id(&nft);
        let title = content_nft::get_title(&nft);
        let description = content_nft::get_description(&nft);
        let preview_url = content_nft::get_preview_url(&nft);
        let content_type = content_nft::get_content_type(&nft);
        let created_at = content_nft::get_created_at(&nft);

        let listing = Listing {
            nft_id,
            seller,
            price,
            nft,
        };

        // 将listing添加到marketplace
        table::add(&mut marketplace.listings, nft_id, listing);

        // 发出上架事件(包含所有NFT元数据)
        event::emit(NFTListed {
            nft_id,
            seller,
            price,
            blob_id,
            title,
            description,
            preview_url,
            content_type,
            created_at,
        });
    }

    /// 从marketplace下架NFT
    ///
    /// @param marketplace - 共享的marketplace对象
    /// @param nft_id - NFT对象ID
    /// @param ctx - 交易上下文
    public entry fun delist_nft(
        marketplace: &mut Marketplace,
        nft_id: ID,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        // 检查listing是否存在
        assert!(table::contains(&marketplace.listings, nft_id), E_NOT_LISTED);

        // 移除listing
        let Listing { nft_id: _, seller, price: _, nft } = table::remove(
            &mut marketplace.listings,
            nft_id
        );

        // 验证是卖家本人
        assert!(sender == seller, E_NOT_SELLER);

        // 将NFT退还给卖家
        transfer::public_transfer(nft, seller);

        // 发出下架事件
        event::emit(NFTDelisted {
            nft_id,
            seller,
        });
    }

    /// 购买NFT
    ///
    /// @param marketplace - 共享的marketplace对象
    /// @param nft_id - NFT对象ID
    /// @param mut payment - 支付的SUI代币
    /// @param ctx - 交易上下文
    public entry fun buy_nft(
        marketplace: &mut Marketplace,
        nft_id: ID,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);

        // 检查listing是否存在
        assert!(table::contains(&marketplace.listings, nft_id), E_NOT_LISTED);

        // 移除listing
        let Listing { nft_id: _, seller, price, nft } = table::remove(
            &mut marketplace.listings,
            nft_id
        );

        // 验证支付金额
        assert!(coin::value(&payment) >= price, E_INSUFFICIENT_PAYMENT);

        // 从支付中分割出准确的价格
        let payment_coin = coin::split(&mut payment, price, ctx);

        // 将剩余的钱退还给买家
        transfer::public_transfer(payment, buyer);

        // 将NFT价格转给卖家
        transfer::public_transfer(payment_coin, seller);

        // 将NFT转移给买家
        transfer::public_transfer(nft, buyer);

        // 发出购买事件
        event::emit(NFTPurchased {
            nft_id,
            buyer,
            seller,
            price,
        });
    }
}
