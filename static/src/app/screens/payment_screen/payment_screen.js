import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { AlertDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { _t } from "@web/core/l10n/translation";

patch(PaymentScreen.prototype, {
  setup() {
    super.setup();
    this.env.services.bus_service.addChannel("scb_payment_callback");
    this.env.services.bus_service.subscribe("PAYMENT_CALLBACK", (data) => {
      var qr_data = this.currentOrder.getQRdata();
      if (qr_data && qr_data.scb_config_id) {
        var json_data = JSON.parse(data);
        // console.log("PAYMENT SCREEN json_data >>>>>>> ", json_data);
        if (
          qr_data.ref1 == json_data.billPaymentRef1 &&
          qr_data.ref2 == json_data.billPaymentRef2 &&
          qr_data.ref3 == json_data.billPaymentRef3
        ) {
          json_data["qrRawData"] = qr_data.qrRawData;
          json_data["scb_config_id"] = qr_data.scb_config_id;
          json_data["qr_status"] = "paid";
          this.currentOrder.setTransactionDetails(json_data);
          if (this.selectedPaymentLine) {
            this.selectedPaymentLine.set_payment_status("done");
            this.validateOrder(false);
          }
        }
      }
    });
    this.env.services.bus_service.start();
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

    if (this.currentOrder.getFixPaymentProductId()) {
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
      this.currentOrder.setFixPaymentProductId(product_id);
    }
    return result;
  },
  deletePaymentLine(uuid) {
    const line = this.paymentLines.find((line) => line.uuid === uuid);
    if (line.payment_method_id.qr_code_method === "qr30") {
      this.currentOrder.setShowQR(false);
      if (this.currentOrder.getFixPaymentProductId()) {
        let line = this.currentOrder.lines.find(
          (line) =>
            line.product_id.id === this.currentOrder.getFixPaymentProductId()
        );
        if (line) {
          if (line.get_quantity() > 1) {
            line.set_quantity(line.get_quantity() - 1, true);
          } else {
            line.delete();
          }
          this.currentOrder.setFixPaymentProductId(false);
        }
      }
    }
    super.deletePaymentLine(uuid);
  },
});
