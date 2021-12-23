"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleorCheckoutAPI = void 0;
const helpers_1 = require("../../helpers");
const types_1 = require("../../state/types");
const types_2 = require("./types");
class SaleorCheckoutAPI extends helpers_1.ErrorListener {
    constructor(saleorState, jobsManager, config) {
        super();
        this.setShippingAddress = (shippingAddress, email, note) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const checkoutId = (_a = this.saleorState.checkout) === null || _a === void 0 ? void 0 : _a.id;
            const alteredLines = (_c = (_b = this.saleorState.checkout) === null || _b === void 0 ? void 0 : _b.lines) === null || _c === void 0 ? void 0 : _c.map(item => ({
                quantity: item.quantity,
                variantId: item === null || item === void 0 ? void 0 : item.variant.id,
            }));
            const noteChanged = ((_d = this.saleorState.checkout) === null || _d === void 0 ? void 0 : _d.note) !== note;
            if (alteredLines && checkoutId) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "setShippingAddress", {
                    channel: this.config.channel,
                    checkoutId,
                    email,
                    selectedShippingAddressId: shippingAddress.id,
                    shippingAddress,
                });
                if (noteChanged) {
                    yield this.jobsManager.run("checkout", "updateNote", {
                        token: (_e = this.saleorState.checkout) === null || _e === void 0 ? void 0 : _e.token,
                        note: note || ''
                    });
                }
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            if (alteredLines) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "createCheckout", {
                    channel: this.config.channel,
                    email,
                    lines: alteredLines,
                    selectedShippingAddressId: shippingAddress.id,
                    shippingAddress,
                    note
                });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to add items to cart before setting shipping address."),
                    type: types_2.FunctionErrorCheckoutTypes.ITEMS_NOT_ADDED_TO_CART,
                },
                pending: false,
            };
        });
        this.setBillingAddress = (billingAddress, email) => __awaiter(this, void 0, void 0, function* () {
            var _f, _g, _h, _j, _k, _l;
            const checkoutId = (_f = this.saleorState.checkout) === null || _f === void 0 ? void 0 : _f.id;
            const isShippingRequiredForProducts = (_h = (_g = this.saleorState.checkout) === null || _g === void 0 ? void 0 : _g.lines) === null || _h === void 0 ? void 0 : _h.filter(line => line.quantity > 0).some(({ variant }) => { var _a; return (_a = variant.product) === null || _a === void 0 ? void 0 : _a.productType.isShippingRequired; });
            const alteredLines = (_k = (_j = this.saleorState.checkout) === null || _j === void 0 ? void 0 : _j.lines) === null || _k === void 0 ? void 0 : _k.map(item => ({
                quantity: item.quantity,
                variantId: item === null || item === void 0 ? void 0 : item.variant.id,
            }));
            if (isShippingRequiredForProducts &&
                checkoutId && ((_l = this.checkout) === null || _l === void 0 ? void 0 : _l.shippingAddress)) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "setBillingAddress", {
                    billingAddress,
                    billingAsShipping: false,
                    checkoutId,
                    selectedBillingAddressId: billingAddress.id,
                });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            if (isShippingRequiredForProducts) {
                return {
                    functionError: {
                        error: new Error("You need to set shipping address before setting billing address."),
                        type: types_2.FunctionErrorCheckoutTypes.SHIPPING_ADDRESS_NOT_SET,
                    },
                    pending: false,
                };
            }
            if (!isShippingRequiredForProducts && email && checkoutId && alteredLines) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "setBillingAddressWithEmail", {
                    billingAddress,
                    checkoutId,
                    email,
                    selectedBillingAddressId: billingAddress.id,
                });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            if (!isShippingRequiredForProducts && email && alteredLines) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "createCheckout", {
                    billingAddress,
                    channel: this.config.channel,
                    email,
                    lines: alteredLines,
                    selectedBillingAddressId: billingAddress.id,
                });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            if (!isShippingRequiredForProducts && !email) {
                return {
                    functionError: {
                        error: new Error("You need to provide email when products do not require shipping before setting billing address."),
                        type: types_2.FunctionErrorCheckoutTypes.EMAIL_NOT_SET,
                    },
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to add items to cart before setting billing address."),
                    type: types_2.FunctionErrorCheckoutTypes.ITEMS_NOT_ADDED_TO_CART,
                },
                pending: false,
            };
        });
        this.setBillingAsShippingAddress = () => __awaiter(this, void 0, void 0, function* () {
            var _m, _o, _p;
            const checkoutId = (_m = this.saleorState.checkout) === null || _m === void 0 ? void 0 : _m.id;
            if (checkoutId && ((_o = this.checkout) === null || _o === void 0 ? void 0 : _o.shippingAddress)) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "setBillingAddress", {
                    billingAddress: this.checkout.shippingAddress,
                    billingAsShipping: true,
                    checkoutId,
                    selectedBillingAddressId: (_p = this.checkout) === null || _p === void 0 ? void 0 : _p.shippingAddress.id,
                });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to set shipping address before setting billing address."),
                    type: types_2.FunctionErrorCheckoutTypes.SHIPPING_ADDRESS_NOT_SET,
                },
                pending: false,
            };
        });
        this.setShippingMethod = (shippingMethodId) => __awaiter(this, void 0, void 0, function* () {
            var _q;
            const checkoutId = (_q = this.saleorState.checkout) === null || _q === void 0 ? void 0 : _q.id;
            if (checkoutId) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "setShippingMethod", {
                    checkoutId,
                    shippingMethodId,
                });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to set shipping address before setting shipping method."),
                    type: types_2.FunctionErrorCheckoutTypes.SHIPPING_ADDRESS_NOT_SET,
                },
                pending: false,
            };
        });
        this.addPromoCode = (promoCode) => __awaiter(this, void 0, void 0, function* () {
            var _r;
            const checkoutId = (_r = this.saleorState.checkout) === null || _r === void 0 ? void 0 : _r.id;
            if (checkoutId) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "addPromoCode", {
                    checkoutId,
                    promoCode,
                });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to set shipping address before modifying promo code."),
                    type: types_2.FunctionErrorCheckoutTypes.SHIPPING_ADDRESS_NOT_SET,
                },
                pending: false,
            };
        });
        this.removePromoCode = (promoCode) => __awaiter(this, void 0, void 0, function* () {
            var _s;
            const checkoutId = (_s = this.saleorState.checkout) === null || _s === void 0 ? void 0 : _s.id;
            if (checkoutId) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "removePromoCode", { checkoutId, promoCode });
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to set shipping address before modifying promo code."),
                    type: types_2.FunctionErrorCheckoutTypes.SHIPPING_ADDRESS_NOT_SET,
                },
                pending: false,
            };
        });
        this.createPayment = (input) => __awaiter(this, void 0, void 0, function* () {
            var _t, _u, _v;
            const checkoutId = (_t = this.saleorState.checkout) === null || _t === void 0 ? void 0 : _t.id;
            const amount = (_v = (_u = this.saleorState.summaryPrices) === null || _u === void 0 ? void 0 : _u.totalPrice) === null || _v === void 0 ? void 0 : _v.gross.amount;
            if (checkoutId && amount !== null && amount !== undefined) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "createPayment", Object.assign(Object.assign({}, input), { amount,
                    checkoutId }));
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to set billing address before creating payment."),
                    type: types_2.FunctionErrorCheckoutTypes.SHIPPING_ADDRESS_NOT_SET,
                },
                pending: false,
            };
        });
        this.completeCheckout = (input) => __awaiter(this, void 0, void 0, function* () {
            var _w;
            const checkoutId = (_w = this.saleorState.checkout) === null || _w === void 0 ? void 0 : _w.id;
            if (checkoutId) {
                const { data, dataError } = yield this.jobsManager.run("checkout", "completeCheckout", Object.assign(Object.assign({}, input), { checkoutId }));
                return {
                    data,
                    dataError,
                    pending: false,
                };
            }
            return {
                functionError: {
                    error: new Error("You need to set shipping address before creating payment."),
                    type: types_2.FunctionErrorCheckoutTypes.SHIPPING_ADDRESS_NOT_SET,
                },
                pending: false,
            };
        });
        this.saleorState = saleorState;
        this.jobsManager = jobsManager;
        this.config = config;
        this.loaded = false;
        this.saleorState.subscribeToChange(types_1.StateItems.CHECKOUT, (checkout) => {
            const { id, token, email, shippingAddress, billingAddress, selectedShippingAddressId, selectedBillingAddressId, billingAsShipping, availablePaymentGateways, availableShippingMethods, shippingMethod, promoCodeDiscount, } = checkout || {};
            this.checkout = {
                billingAddress,
                email,
                id,
                shippingAddress,
                shippingMethod,
                token,
            };
            this.selectedShippingAddressId = selectedShippingAddressId;
            this.selectedBillingAddressId = selectedBillingAddressId;
            this.availablePaymentGateways = availablePaymentGateways;
            this.availableShippingMethods = availableShippingMethods;
            this.billingAsShipping = billingAsShipping;
            this.promoCodeDiscount = {
                discountName: promoCodeDiscount === null || promoCodeDiscount === void 0 ? void 0 : promoCodeDiscount.discountName,
                voucherCode: promoCodeDiscount === null || promoCodeDiscount === void 0 ? void 0 : promoCodeDiscount.voucherCode,
            };
        });
        this.saleorState.subscribeToChange(types_1.StateItems.PAYMENT, (payment) => {
            const { id, token, gateway, creditCard, total } = payment || {};
            this.payment = {
                creditCard,
                gateway,
                id,
                token,
                total,
            };
        });
        this.saleorState.subscribeToChange(types_1.StateItems.LOADED, (loaded) => {
            this.loaded = loaded.checkout && loaded.payment;
        });
    }
}
exports.SaleorCheckoutAPI = SaleorCheckoutAPI;
//# sourceMappingURL=index.js.map