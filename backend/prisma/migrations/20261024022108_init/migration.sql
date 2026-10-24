-- CreateTable
CREATE TABLE "CierreTransaccion" (
    "Cierre_id" BIGSERIAL NOT NULL,
    "Cierre_TerminalID" VARCHAR(15) NOT NULL,
    "Cierre_Lot" VARCHAR(250),
    "Cierre_Date" TIMESTAMP(6) NOT NULL,
    "Cierre_TypeTrx" INTEGER NOT NULL,
    "Cierre_TypeCierre" INTEGER NOT NULL,
    "Cierre_Totales" TEXT NOT NULL,
    "Cierre_Batch" TEXT NOT NULL,
    "Merchant_Email" VARCHAR(250) NOT NULL,
    "Merchant_Name" VARCHAR(150),
    "Merchant_Address" VARCHAR(150),
    "Merchant_Phone" VARCHAR(20),
    "Merchant_City" VARCHAR(150) NOT NULL,
    "Merchant_MID" VARCHAR(150) NOT NULL,
    "Merchant_TID" VARCHAR(50) NOT NULL,
    "Cierre_UUID" VARCHAR(250) NOT NULL,
    "Transac_RESERVADO1" VARCHAR(255),
    "Transac_RESERVADO2" VARCHAR(255),
    "Transac_RESERVADO3" VARCHAR(255),
    "Transac_RESERVADO4" VARCHAR(255),
    "Transac_RESERVADO5" VARCHAR(255),
    "MODELOPOS" VARCHAR(255),
    "Merchant_RESERVADO1" VARCHAR(255),
    "Merchant_RESERVADO2" VARCHAR(255),
    "Merchant_RESERVADO3" VARCHAR(255),
    "Cierre_CreatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "Cierre_CreatedDerived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CierreTransaccion_pkey" PRIMARY KEY ("Cierre_Date","Cierre_UUID")
);

-- CreateTable
CREATE TABLE "Client" (
    "Client_id" BIGSERIAL NOT NULL,
    "Client_CC" VARCHAR(100) NOT NULL,
    "Client_Email" VARCHAR(250) NOT NULL,
    "Client_Phone" VARCHAR(20),
    "Client_Auth" VARCHAR(250) NOT NULL,
    "Client_UUID" VARCHAR(250) NOT NULL,
    "Tipo_Envio" INTEGER NOT NULL DEFAULT 6,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("Client_Auth","Client_UUID")
);

-- CreateTable
CREATE TABLE "Merchants" (
    "merchant_id" BIGSERIAL NOT NULL,
    "merchant_Title" VARCHAR(100) NOT NULL,
    "merchant_Name" VARCHAR(50),
    "merchant_Address" VARCHAR(50),
    "merchant_Phone" VARCHAR(20),
    "merchant_City" VARCHAR(25) NOT NULL,
    "merchant_MID" VARCHAR(150) NOT NULL,
    "merchant_TID" VARCHAR(50) NOT NULL,
    "merchant_TrxID" VARCHAR(50) NOT NULL,
    "merchant_VersionPos" VARCHAR(150) NOT NULL,
    "merchant_UUID" VARCHAR(250) NOT NULL,
    "merchant_expirationInvoice" BIGINT,
    "merchant_modeloPos" VARCHAR(50),
    "Email" VARCHAR(100) NOT NULL DEFAULT 'NA',

    CONSTRAINT "Merchants_pkey" PRIMARY KEY ("merchant_TrxID","merchant_UUID")
);

-- CreateTable
CREATE TABLE "ModeloTerminal" (
    "model_id" INTEGER NOT NULL,
    "model_descripcion" VARCHAR(50),

    CONSTRAINT "ModeloTerminal_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "TransactionQr" (
    "Id" BIGSERIAL NOT NULL,
    "Uuid" VARCHAR(100) NOT NULL,
    "TipoTransaccionTitle" VARCHAR(200),
    "TipoTransaccion" VARCHAR(100),
    "Pan" VARCHAR(150),
    "TipoLectura" VARCHAR(100),
    "NumeroAprobacion" VARCHAR(100),
    "Referencia" VARCHAR(200),
    "DateTime" TIMESTAMP(6) NOT NULL,
    "Tipo" VARCHAR(50),
    "RegistroContribuyente" VARCHAR(100),
    "ReferenciaPix" VARCHAR(200),
    "MonedaUsdBs" VARCHAR(10),
    "MontoPago" DECIMAL(18,2),
    "MonedaReales" VARCHAR(10),
    "MontoReales" DECIMAL(18,2),
    "TasaCambio" VARCHAR(50),
    "PiePagina" VARCHAR(200),
    "LeyendaAsfi" VARCHAR(500),
    "tipo_estado_transaction" VARCHAR(1),
    "flag_modo_caja" VARCHAR(1),
    "Res1" VARCHAR(200),
    "Res2" VARCHAR(200),
    "Res3" VARCHAR(200),
    "Res4" VARCHAR(200),
    "Res5" VARCHAR(200),

    CONSTRAINT "TransactionQr_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "Transac_id" BIGSERIAL NOT NULL,
    "Transac_Lot" VARCHAR(250),
    "Transac_Ref" VARCHAR(250),
    "Transac_TypeTrx" INTEGER NOT NULL,
    "Transac_TypeRead" INTEGER NOT NULL,
    "Transac_Label" VARCHAR(150) NOT NULL,
    "Transac_NameCard" VARCHAR(150) NOT NULL,
    "Transac_AID" VARCHAR(150) NOT NULL,
    "Transac_NumCard" VARCHAR(150) NOT NULL,
    "Transac_Date" TIMESTAMP(6) NOT NULL,
    "Transac_RRN" VARCHAR(250),
    "Transac_Aut" VARCHAR(250) NOT NULL,
    "Transac_SMOD" VARCHAR(10) NOT NULL,
    "Transac_IVA" VARCHAR(10) NOT NULL,
    "Transac_Service" VARCHAR(15),
    "Transac_Tip" VARCHAR(15),
    "Transac_Total" VARCHAR(100),
    "Transac_ClientID" VARCHAR(100) NOT NULL,
    "Transac_UUID" VARCHAR(250) NOT NULL,
    "Transac_DateVenc" VARCHAR(50),
    "transac_TypeTarjet" VARCHAR(150),
    "Transac_msgEstadoPagoQr" VARCHAR(200),
    "Transac_FLAG_DONACION" VARCHAR(50),
    "Transac_CUOTAS" VARCHAR(50),
    "Transac_CASHBACK" VARCHAR(50),
    "Transac_DESC_BJ" VARCHAR(50),
    "Transac_MSG_BJ" VARCHAR(200),
    "Transac_PROMO_BANX" VARCHAR(50),
    "Transac_MSG_PROMO_BANX" VARCHAR(200),
    "Transac_TITLE" VARCHAR(200),
    "Transac_FOOTER" VARCHAR(200),
    "Transac_TIPO_SALE" VARCHAR(50),
    "Transac_CONSUMO_AMOUNT" VARCHAR(50),
    "Transac_RESERVADO1" VARCHAR(200),
    "Transac_RESERVADO2" VARCHAR(200),
    "Transac_RESERVADO3" VARCHAR(200),
    "Transac_Change_Currency" VARCHAR(10),
    "Transac_Change_Amount" VARCHAR(50),
    "Transac_Markup" VARCHAR(10),
    "Transac_Total_Change_Amount" VARCHAR(50),
    "Transac_modo_caja" BOOLEAN NOT NULL DEFAULT false,
    "Transac_Amount" VARCHAR(15),
    "Transac_PartialAmount" VARCHAR(15) NOT NULL DEFAULT '0',
    "Transac_CreatedAt" TIMESTAMP(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'::text),
    "Transac_CreatedDerived" BOOLEAN NOT NULL DEFAULT false,
    "Transac_CreatedAtBackup" TIMESTAMP(6),

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("Transac_Date","Transac_UUID")
);

-- CreateTable
CREATE TABLE "TypeCierre" (
    "id" SERIAL NOT NULL,
    "id_transac" INTEGER,
    "descripcion" VARCHAR(30),
    "modeloTerminal" VARCHAR(10)
);

-- CreateTable
CREATE TABLE "TypeRead" (
    "Read_id" INTEGER NOT NULL,
    "Read_descripcion" VARCHAR(150),

    CONSTRAINT "TypeRead_pkey" PRIMARY KEY ("Read_id")
);

-- CreateTable
CREATE TABLE "TypeTransacionModel" (
    "id" SERIAL NOT NULL,
    "transacId" INTEGER,
    "descripcion" VARCHAR(30),
    "modeloTerminal" VARCHAR(10),

    CONSTRAINT "TypeTransacionModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeTransaction" (
    "Transact_id" INTEGER NOT NULL,
    "Transact_descripcion" VARCHAR(150),

    CONSTRAINT "TypeTransaction_pkey" PRIMARY KEY ("Transact_id")
);

-- CreateTable
CREATE TABLE "htmls_merchants" (
    "id" BIGSERIAL NOT NULL,
    "UUID" VARCHAR(250),
    "html_mail" TEXT,
    "html_voucher" TEXT,
    "pdf_base64" TEXT,
    "insertion_date" TIMESTAMP(6),
    "type_trx" VARCHAR(50),
    "id_type_trx" VARCHAR(15),

    CONSTRAINT "htmls_merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sc_log" (
    "id" SERIAL NOT NULL,
    "inserted_date" TIMESTAMP(6),
    "username" VARCHAR(90) NOT NULL DEFAULT '',
    "application" VARCHAR(200) NOT NULL DEFAULT '',
    "creator" VARCHAR(30) NOT NULL DEFAULT '',
    "ip_user" VARCHAR(32) NOT NULL DEFAULT '',
    "action" VARCHAR(30) NOT NULL DEFAULT '',
    "description" TEXT,

    CONSTRAINT "sc_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sec_apps" (
    "app_name" VARCHAR(150) NOT NULL DEFAULT '',
    "app_type" TEXT,
    "description" TEXT,

    CONSTRAINT "sec_apps_pkey" PRIMARY KEY ("app_name")
);

-- CreateTable
CREATE TABLE "sec_groups" (
    "group_id" SERIAL NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "sec_groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "sec_groups_apps" (
    "group_id" INTEGER NOT NULL,
    "app_name" VARCHAR(150) NOT NULL DEFAULT '',
    "priv_access" TEXT,
    "priv_insert" TEXT,
    "priv_delete" TEXT,
    "priv_update" TEXT,
    "priv_export" TEXT,
    "priv_print" TEXT,

    CONSTRAINT "sec_groups_apps_pkey" PRIMARY KEY ("app_name","group_id")
);

-- CreateTable
CREATE TABLE "sec_users" (
    "login" VARCHAR(150) NOT NULL DEFAULT '',
    "pswd" VARCHAR(150) NOT NULL DEFAULT '',
    "name" TEXT,
    "email" TEXT,
    "usr_active" TEXT,
    "activation_code" TEXT,
    "priv_admin" TEXT,
    "usr_fecha_exp_clave" TIMESTAMP(6),
    "usr_fecha_creacion_clave" TIMESTAMP(6),
    "usr_intentos" INTEGER,
    "UsuarioAlta" VARCHAR(20),
    "FechaAlta" TIMESTAMP(6),
    "UsuarioUltAlta" VARCHAR(20),
    "FechaHoraUltAct" TIMESTAMP(6),
    "Authentication_code" INTEGER,
    "validity_code" TIMESTAMP(6),
    "Intentos_Authe" INTEGER,
    "ValTime" DATE,

    CONSTRAINT "sec_users_pkey" PRIMARY KEY ("login")
);

-- CreateTable
CREATE TABLE "sec_users_groups" (
    "login" VARCHAR(150) NOT NULL DEFAULT '',
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "sec_users_groups_pkey" PRIMARY KEY ("group_id","login")
);

-- CreateTable
CREATE TABLE "sec_users_historico_claves" (
    "id" BIGSERIAL NOT NULL,
    "fecha" TIMESTAMP(6) NOT NULL,
    "usu_login" VARCHAR(150) NOT NULL,
    "usu_hash_antiguo" VARCHAR(250),

    CONSTRAINT "sec_users_historico_claves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_envio" (
    "id" INTEGER NOT NULL,
    "descripcion" VARCHAR(100),

    CONSTRAINT "tipo_envio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IX_Client_Client_UUID" ON "Client"("Client_UUID");

-- CreateIndex
CREATE INDEX "IX_Merchants_Name" ON "Merchants"("merchant_Name");

-- CreateIndex
CREATE INDEX "IX_Merchants_merchant_UUID" ON "Merchants"("merchant_UUID");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_TransactionQrPix_Uuid" ON "TransactionQr"("Uuid");

-- CreateIndex
CREATE INDEX "IX_TransactionQrPix_Id" ON "TransactionQr"("Id");

-- CreateIndex
CREATE INDEX "IX_TransactionQrPix_Uuid" ON "TransactionQr"("Uuid");

-- CreateIndex
CREATE INDEX "IX_TransactionQr_Lot_Date" ON "TransactionQr"("Res1", "DateTime");

-- CreateIndex
CREATE INDEX "IX_Transactions_Lot_Date" ON "Transactions"("Transac_Lot", "Transac_Date");

-- CreateIndex
CREATE INDEX "IX_transactions_Transac_UUID" ON "Transactions"("Transac_UUID");

-- CreateIndex
CREATE INDEX "IX_transactions_transac_date" ON "Transactions"("Transac_Date");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "FK_Client_TipoEnvio" FOREIGN KEY ("Tipo_Envio") REFERENCES "tipo_envio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "fk_Transaction_Type" FOREIGN KEY ("Transac_TypeTrx") REFERENCES "TypeTransaction"("Transact_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "fk_Transaction_TypeRead" FOREIGN KEY ("Transac_TypeRead") REFERENCES "TypeRead"("Read_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sec_users_historico_claves" ADD CONSTRAINT "FK_UsuarioHistoricoClaves_secUsers" FOREIGN KEY ("usu_login") REFERENCES "sec_users"("login") ON DELETE NO ACTION ON UPDATE NO ACTION;
