import { PosPayment } from "@point_of_sale/app/models/pos_payment";
import { patch } from "@web/core/utils/patch";

patch(PosPayment.prototype, {
  handle_payment_response(isPaymentSuccessful) {
    var result = super.handle_payment_response(isPaymentSuccessful);
    if (this.payment_method_id.qr_code_method === "qr30" && !this.isConfirmed) {
      if (this.isCancelled) {
        this.set_payment_status("retry");
      } else if (this.isTimerExpired) {
        this.set_payment_status("qr30TimerExpired");
      } else {
        this.set_payment_status("qr30PaymentPending");
      }
    }
    return result;
  },
});
