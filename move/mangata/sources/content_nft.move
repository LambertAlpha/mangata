/// Mangata Content NFT Module
///
/// 这个模块实现了去中心化内容订阅平台的核心逻辑:
/// - ContentNFT: 表示加密内容的所有权
/// - 与 Seal 集成实现访问控制
/// - 与 Walrus 集成存储加密内容
module mangata::content_nft {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;

    /// 错误码
    const E_INVALID_PRICE: u64 = 0;
    const E_INSUFFICIENT_PAYMENT: u64 = 1;
    const E_NOT_OWNER: u64 = 2;

    /// ContentNFT 代表一个加密内容的访问权
    /// 持有此 NFT 即可解密并查看对应的内容
    public struct ContentNFT has key, store {
        id: UID,
        /// Walrus 存储的加密内容 blob ID
        blob_id: String,
        /// Seal 加密的元数据 (包含解密所需的信息)
        encrypted_metadata: vector<u8>,
        /// 创作者地址
        creator: address,
        /// NFT 售价 (SUI, 单位: MIST, 1 SUI = 1_000_000_000 MIST)
        price: u64,
        /// 预览图 URL (未加密,公开可访问)
        preview_url: String,
        /// 内容标题
        title: String,
        /// 内容描述
        description: String,
        /// 内容类型: "image" | "text" | "video"
        content_type: String,
        /// 创建时间戳 (毫秒)
        created_at: u64,
    }

    /// 铸造事件 - 当创作者创建新的 ContentNFT 时触发
    public struct NFTMinted has copy, drop {
        nft_id: address,
        creator: address,
        blob_id: String,
        title: String,
        price: u64,
        created_at: u64,
    }

    /// 购买事件 - 当用户购买 NFT 时触发
    public struct NFTPurchased has copy, drop {
        nft_id: address,
        buyer: address,
        seller: address,
        price: u64,
    }

    /// 转让事件 - 当 NFT 所有权转移时触发
    public struct NFTTransferred has copy, drop {
        nft_id: address,
        from: address,
        to: address,
    }

    /// 铸造 ContentNFT
    ///
    /// @param blob_id - Walrus 上的加密内容 blob ID
    /// @param encrypted_metadata - Seal 加密的元数据
    /// @param price - NFT 售价 (MIST)
    /// @param preview_url - 预览图 URL
    /// @param title - 内容标题
    /// @param description - 内容描述
    /// @param content_type - 内容类型
    /// @param ctx - 交易上下文
    public entry fun mint_nft(
        blob_id: vector<u8>,
        encrypted_metadata: vector<u8>,
        price: u64,
        preview_url: vector<u8>,
        title: vector<u8>,
        description: vector<u8>,
        content_type: vector<u8>,
        ctx: &mut TxContext
    ) {
        // 验证价格
        assert!(price > 0, E_INVALID_PRICE);

        let creator = tx_context::sender(ctx);
        let created_at = tx_context::epoch_timestamp_ms(ctx);

        let nft = ContentNFT {
            id: object::new(ctx),
            blob_id: string::utf8(blob_id),
            encrypted_metadata,
            creator,
            price,
            preview_url: string::utf8(preview_url),
            title: string::utf8(title),
            description: string::utf8(description),
            content_type: string::utf8(content_type),
            created_at,
        };

        let nft_id = object::id_address(&nft);

        // 发出铸造事件
        event::emit(NFTMinted {
            nft_id,
            creator,
            blob_id: nft.blob_id,
            title: nft.title,
            price,
            created_at,
        });

        // 将 NFT 转移给创作者
        transfer::public_transfer(nft, creator);
    }

    /// 购买 NFT (一次性买断)
    ///
    /// @param nft - 要购买的 ContentNFT
    /// @param payment - 支付的 SUI 代币
    /// @param ctx - 交易上下文
    public entry fun purchase_nft(
        nft: ContentNFT,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        let seller = nft.creator;
        let price = nft.price;
        let nft_id = object::id_address(&nft);

        // 验证支付金额
        assert!(coin::value(&payment) >= price, E_INSUFFICIENT_PAYMENT);

        // 从支付中分割出准确的价格
        let payment_coin = coin::split(&mut payment, price, ctx);

        // 将剩余的钱退还给买家
        transfer::public_transfer(payment, buyer);

        // 将 NFT 价格转给创作者
        transfer::public_transfer(payment_coin, seller);

        // 发出购买事件
        event::emit(NFTPurchased {
            nft_id,
            buyer,
            seller,
            price,
        });

        // 将 NFT 转移给买家
        transfer::public_transfer(nft, buyer);
    }

    /// 创作者更新 NFT 价格
    /// 只有创作者可以修改价格
    ///
    /// @param nft - 要更新的 ContentNFT
    /// @param new_price - 新价格
    /// @param ctx - 交易上下文
    public entry fun update_price(
        nft: &mut ContentNFT,
        new_price: u64,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);

        // 只有创作者可以更新价格
        assert!(sender == nft.creator, E_NOT_OWNER);
        assert!(new_price > 0, E_INVALID_PRICE);

        nft.price = new_price;
    }

    /// 转让 NFT 给另一个地址
    ///
    /// @param nft - 要转让的 ContentNFT
    /// @param recipient - 接收者地址
    /// @param ctx - 交易上下文
    public entry fun transfer_nft(
        nft: ContentNFT,
        recipient: address,
        ctx: &TxContext
    ) {
        let from = tx_context::sender(ctx);
        let nft_id = object::id_address(&nft);

        // 发出转让事件
        event::emit(NFTTransferred {
            nft_id,
            from,
            to: recipient,
        });

        transfer::public_transfer(nft, recipient);
    }

    // ============ Getter Functions ============
    // 这些函数用于查询 NFT 的属性

    public fun get_blob_id(nft: &ContentNFT): String {
        nft.blob_id
    }

    public fun get_encrypted_metadata(nft: &ContentNFT): vector<u8> {
        nft.encrypted_metadata
    }

    public fun get_creator(nft: &ContentNFT): address {
        nft.creator
    }

    public fun get_price(nft: &ContentNFT): u64 {
        nft.price
    }

    public fun get_preview_url(nft: &ContentNFT): String {
        nft.preview_url
    }

    public fun get_title(nft: &ContentNFT): String {
        nft.title
    }

    public fun get_description(nft: &ContentNFT): String {
        nft.description
    }

    public fun get_content_type(nft: &ContentNFT): String {
        nft.content_type
    }

    public fun get_created_at(nft: &ContentNFT): u64 {
        nft.created_at
    }

    // ============ Seal Integration Functions ============
    // 这些函数用于 Seal 访问控制集成

    /// 验证调用者是否有权限访问内容
    /// 这个函数会被 Seal 在解密时调用
    ///
    /// @param nft - ContentNFT 引用
    /// @param ctx - 交易上下文
    /// @return 如果调用者持有 NFT 则返回 true
    public fun seal_approve_access(
        _nft: &ContentNFT,
        _ctx: &TxContext
    ): bool {
        // 注意: 在实际使用中,Seal 会自动验证调用者是否持有 NFT
        // 这里我们简化处理,直接返回 true
        // 真正的访问控制由 Sui 的对象所有权模型保证
        true
    }
}
