import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { _t } from "@web/core/l10n/translation";

patch(PaymentScreen.prototype, {
  setup() {
    super.setup();
    this.env.services.bus_service.subscribe("PAYMENT_CALLBACK", (data) => {
      console.log("Verified from payment screen");
      if (this.currentOrder?.hasQR30PaymentLine()) {
        var payment = this.currentOrder.getQR30PaymentLine();
        if (payment.get_payment_status() != "done") {
          var json_data = JSON.parse(data);
          // console.log("PAYMENT SCREEN json_data >>>>>>> ", json_data);
          if (
            payment.qr30_ref1 == json_data.billPaymentRef1 &&
            payment.qr30_ref2 == json_data.billPaymentRef2 &&
            payment.qr30_ref3 == json_data.billPaymentRef3
          ) {
            payment.setTransactionDetails(json_data);
            // this.currentOrder.setTransactionDetails(json_data);
            if (this.selectedPaymentLine) {
              this.validateOrder(false);
            }
          }
        }
      }
    });
  },

  async addNewPaymentLine(paymentMethod) {
    if (paymentMethod.qr_code_method != "qr30")
      return await super.addNewPaymentLine(paymentMethod);

    if (paymentMethod.qr30_payment_fee <= 0)
      return await super.addNewPaymentLine(paymentMethod);

    const product_id = paymentMethod._raw.qr30_payment_fee_product_id;
    if (!product_id) {
      this.dialog.add(AlertDialog, {
        title: _t("Error"),
        body: _t(
          "Invalid payment method configuration: payment fee product is not set."
        ),
      });
      return;
    }

    this.currentOrder.setQR30PaymentFeeProductId(product_id);

    if (this.currentOrder.hasQR30PaymentLine()) {
      this.dialog.add(AlertDialog, {
        title: _t("Error"),
        body: _t("Only one QR30 payment is allowed."),
      });
      return;
    }

    let product = this.pos.models["product.product"].get(product_id);
    if (!product) {
      product = await this.pos.data.searchRead("product.product", [
        ["id", "=", product_id],
      ]);
      // get first product
      product = product.length > 0 && product[0];
    }
    if (!product) {
      this.dialog.add(AlertDialog, {
        title: _t("Error"),
        body: _t(
          "Invalid payment method configuration: payment fee product not found."
        ),
      });
      return;
    }

    let line = this.currentOrder.lines.find(
      (line) => line.product_id.id === product.id
    );

    if (line) {
      console.log(line.get_quantity());
      line.set_quantity(line.get_quantity() + 1, true);
    } else {
      line = await this.pos.addLineToCurrentOrder(
        {
          product_id: product,
          price_unit: paymentMethod.qr30_payment_fee,
        },
        {}
      );
    }

    const result = await super.addNewPaymentLine(paymentMethod);
    if (!result) {
      line.delete();
    } else {
      this.currentOrder.setQR30PaymentLine(this.selectedPaymentLine);
    }
    return result;
  },
  deletePaymentLine(uuid) {
    const line = this.paymentLines.find((line) => line.uuid === uuid);
    if (line.payment_method_id.qr_code_method === "qr30") {
      this.currentOrder.clearQR30PaymentLine();
      if (this.currentOrder.getQR30PaymentFeeProductId()) {
        let line = this.currentOrder.lines.find(
          (line) =>
            line.product_id.id ===
            this.currentOrder.getQR30PaymentFeeProductId()
        );
        if (line) {
          if (line.get_quantity() > 1) {
            line.set_quantity(line.get_quantity() - 1, true);
          } else {
            line.delete();
          }
        }
      }
    }
    super.deletePaymentLine(uuid);
  },
});
