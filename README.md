# Point of Sale QR30 Integration - SCB

The Point of sale QR30 module provides integration with SCB's qr code payment service via Thai QR Code Tag 30 (QR 30). It allows the POS system to validate a customer payment with the callback url from the bank when a customer pays by scanning a QR code with a Thai bank's mobile application.

This module collects the following data from the bank. Please check the PDPA law.

- Transaction id
- Payer's bank
- Payer account name
- Payer account number

## Supported features

- Direct payment flow
- Automatic payment confirmation
- Manual payment confirmation
- Payment limits (min-max)
- Payment fee

## Technical details

API: [SCB Standard Checkout](https://developer.scb.co.th/#/documents/documentation/qr-payment/thai-qr.html)

SDK: [SCB Development App](https://developer.scb.co.th/#/documents/documentation/basics/getting-started.html)

This module requires API key and secret from SCB. You should register with SCB to get them.

When the Send button is clicked, a server-to-server API call is made to create the qr code.
When the payment is made, the system receives notification from SCB via a callback endpoint(/pos_qr/notification) and the payment is confirmed automatically.

The payment confirmation is sent to a web client via webhook. Make sure the proxy allows this.

### Compatibility

- Odoo 18

## Configuration

First, you need to create a payment for POS.
To configure this module, you need to:

- Go to Point of Sale > Configuration > Payment Methods > New
  ![Configuration](https://raw.githubusercontent.com/ncharlie/pos_qr30_scb/refs/heads/master/static/description/setup1.png)

- Original setup

  - Set the method name
  - Assign a journal
  - Integration: Select "Bank App (QR Code)"
  - QR Code Format: Select "QR Tag 30"

- Additional setup

  - "Bank" is fixed as SCB.
  - "Name" can be shop name or any text you want to display with the QR code.
  - "Enable Callback" is to allow callback from SCB.
  - "Callback URL" is the callback endpoint in Odoo system. Copy the generated value and put it in SCB configuration.
    ![SCB Configuration](https://raw.githubusercontent.com/ncharlie/pos_qr30_scb/refs/heads/master/static/description/setup2.png)
  - "Biller ID" is provided by SCB in merchant profile menu.
  - "Ref 3 Prefix" is also in merchant profile.

  - "API Key" is from Application menu.
  - "API Secret" is also from application.

  - "Base url" is the url prefix to the endpoints. The default value is for sandbox environment.

  - "Customer Fee" is the service charge for this payment. Set it as you'd like.
  - "Fix Payment Product" is the product to associate with "Customer Fee". You can create a new service type product. This product appears in the receipt.
    ![Receipt](https://raw.githubusercontent.com/ncharlie/pos_qr30_scb/refs/heads/master/static/description/receipt1.png)

- (Optional) Click Test Connection to test the configuration.

- Add this new payment method to your Point of Sale shop.

## Usage

To use this payment,

- After checking out, select the payment method associated with QR tag 30 and click send.
  ![Select Payment Method](https://raw.githubusercontent.com/ncharlie/pos_qr30_scb/refs/heads/master/static/description/usage1.png)

- The qrcode popup will appears.
  ![QR Code popup](https://raw.githubusercontent.com/ncharlie/pos_qr30_scb/refs/heads/master/static/description/usage2.png)

There are 2 ways to view payment history,

1. Go to Point of Sale > Orders > Orders

- Select an order that is paid via this method and go to QR30 Payment History tab in the notebook.
  ![Order history](https://raw.githubusercontent.com/ncharlie/pos_qr30_scb/refs/heads/master/static/description/history1.png)

- Click to view full information
  ![Full payment history](https://raw.githubusercontent.com/ncharlie/pos_qr30_scb/refs/heads/master/static/description/history2.png)

2. Go to Point of Sale > Orders > SCB Payment History

- Here you can see a list of payments made and their status "Paid" or "Confirmed Manually"

## Module history

- `18.0`
  - Released

## Testing instructions

Payments must be made using a separate [sandbox account](https://developer.scb.co.th/#/management/apps).

Read more at https://developer.scb.co.th/#/documents.
