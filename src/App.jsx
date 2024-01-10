import { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [appliedVouchers, setAppliedVouchers] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  // ambil data toko
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get("/api/tenants");
        setTenants(response.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  // handle perubahan tenant
  const handleTenantChange = (id) => {
    const selectedTenantObject = tenants.find((tenant) => tenant.id == id);
    setSelectedTenant(selectedTenantObject);
    setCart([]);
  };

  // ambil data produk dari tenant yang dipilih
  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedTenant) {
        try {
          const response = await axios.get(
            `/api/tenants/${selectedTenant.id}/products`,
          );
          setProducts(response.data);
        } catch (err) {
          console.log(err);
        }
      }
    };

    fetchProducts();
  }, [selectedTenant]);

  // proses menambahkan produk cart
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      // jika sudah ada produk tambahkan quantity
      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      // jika belum ada produk di cart
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // handle buang produk dari cart
  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // handle pengecekan voucher
  const handleApplyVoucher = async () => {
    try {
      const response = await axios.get(`/api/voucher/${voucherCode}`);
      if (response.data.success) {
        // cek masih valid atau tidak
        const isVoucherExist = appliedVouchers.some(
          (appliedVoucher) => appliedVoucher.id === response.data.voucher.id,
        );
        // jika masih tersedia
        if (!isVoucherExist) {
          setAppliedVouchers((prevVouchers) => [
            ...prevVouchers,
            response.data.voucher,
          ]);
        } else {
          alert("Voucher sudah diaplikasikan sebelumnya.");
        }
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  // handle total diskon
  useEffect(() => {
    setDiscount(appliedVouchers.length * 10000);
  }, [appliedVouchers]);

  // handle total keseluruhan harga
  useEffect(() => {
    const totalPrice = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const totalPriceWithDiscount = totalPrice - discount;
    setTotalPrice(totalPriceWithDiscount);
  }, [cart, discount]);

  const handleCheckout = async () => {
    try {
      let data = {
        cart,
        tenantId: selectedTenant.id,
      };
      if (appliedVouchers.length > 0) {
        data["vouchers"] = appliedVouchers;
      }
      const response = await axios.post("/api/transaction/checkout", data);
      // jika menerima voucher
      if (response.data.vouchers && response.data.vouchers.length > 0) {
        alert(
          `Checkout berhasil. selamat kamu dapat ${
            response.data.vouchers.length
          } Voucher: \n ${response.data.vouchers.join(
            ", ",
          )}\n Selamat Belanja Kembali`,
        );
      } else {
        alert("Checkout berhasil.");
      }
    } catch (error) {
      console.log(error);
      alert("Terjadi kesalahan saat melakukan checkout.");
    } finally {
      setCart([]);
      setAppliedVouchers([]);
      setVoucherCode("");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }
  return (
    <main className="bg-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* title */}
        <h1 className="mb-4 text-center text-3xl font-bold uppercase">
          Halaman Belanja
        </h1>
        {/* select pilih toko */}
        <div className="mb-5 flex items-center gap-3">
          <label htmlFor="selectTenant">Pilih Toko</label>
          <select
            id="selectTenant"
            className="border p-2"
            onChange={(e) => handleTenantChange(e.target.value)}
            value={selectedTenant.id}
          >
            <option value="" disabled selected hidden>
              Pilih Toko
            </option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        {/* tampilkan produk toko pilihan */}
        {selectedTenant && (
          <div>
            <h2 className="mb-1 text-2xl font-bold text-green-700">
              Produk {selectedTenant.name}
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border p-4 shadow shadow-slate-500"
                >
                  <p>{product.name}</p>
                  <p className="font-bold">Rp {product.price}</p>
                  <button
                    className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-800"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* menampilkan item yang dipilih */}
        {cart.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-1 text-2xl font-bold text-red-700">
              Keranjang Belanja
            </h2>
            {/* cart item */}
            <div>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border p-4 shadow shadow-slate-500"
                >
                  <div>
                    {item.name} - Rp {item.price} x{" "}
                    <span className="text-blue-800">{item.quantity} item</span>
                  </div>
                  <button
                    className="rounded bg-red-500 px-4 py-2 text-white"
                    onClick={() => handleRemoveFromCart(item.id)}
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
            {/* voucher check */}
            <div className="mt-4 flex items-center gap-4">
              <label>Voucher Code</label>
              <input
                type="text"
                className="border border-black p-2"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <button
                className="rounded bg-green-700 px-4 py-2 text-white"
                onClick={handleApplyVoucher}
              >
                Cek Voucher
              </button>
            </div>
            {/* total nominal belanja */}
            <div className="mt-8 flex max-w-sm items-center justify-between font-bold">
              <span>Total Harga Belanja</span>
              <span>Rp {totalPrice + discount}</span>
            </div>

            {/* total diskon */}
            {discount > 0 && (
              <div className="">
                <div className="flex gap-3">
                  voucher yang digunakan:
                  {appliedVouchers.map((voucher) => (
                    <span key={voucherCode}>{voucher.voucher_code}</span>
                  ))}
                </div>
                <p className="text-red-600">Discount: -Rp {discount}</p>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xl font-bold">Total Bayar: Rp. {totalPrice}</p>
              <button
                className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default App;
