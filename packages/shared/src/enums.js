"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingStatus = exports.PaymentStatus = exports.BookingStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["ACTIVE"] = "ACTIVE";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["DISPUTED"] = "DISPUTED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["HELD"] = "HELD";
    PaymentStatus["RELEASED"] = "RELEASED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["DRAFT"] = "DRAFT";
    ListingStatus["PUBLISHED"] = "PUBLISHED";
    ListingStatus["PAUSED"] = "PAUSED";
    ListingStatus["ARCHIVED"] = "ARCHIVED";
})(ListingStatus || (exports.ListingStatus = ListingStatus = {}));
//# sourceMappingURL=enums.js.map