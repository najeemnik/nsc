<?php
/**
 * NSC Labor Wages & Payroll Management API
 * Solves Excel Flaw #3: Labor Directly Connected to Project Actual Costs & P&L
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

sendSecurityHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getConnection();
$user = authenticateUser(false);

if ($method === 'GET') {
    $projectId = $_GET['projectId'] ?? null;
    $sql = "SELECT lp.*, p.name as project_name 
            FROM labor_payroll lp 
            LEFT JOIN projects p ON lp.project_id = p.id";
    $params = [];
    if ($projectId) {
        $sql .= " WHERE lp.project_id = :pid";
        $params['pid'] = $projectId;
    }
    $sql .= " ORDER BY lp.payroll_date DESC LIMIT 200";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse(true, ['payroll' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];

    $id = generateUuid();
    $payrollNo = 'PAY-' . date('ymd') . '-' . rand(100, 999);
    $projectId = $input['projectId'] ?? '';
    $workerName = trim($input['workerOrTeamLeader'] ?? $input['workerName'] ?? '');
    $workType = trim($input['workTypeDescription'] ?? $input['workType'] ?? 'کارگری عمومی');
    $daysOrUnits = (float)($input['daysOrWorkUnits'] ?? $input['days'] ?? 0);
    $rate = (float)($input['ratePerUnit'] ?? $input['rate'] ?? 0);
    $advance = (float)($input['advanceDeduction'] ?? $input['advance'] ?? 0);

    $gross = $daysOrUnits * $rate;
    $netPaid = max(0, $gross - $advance);
    $date = !empty($input['payrollDate']) ? $input['payrollDate'] : date('Y-m-d');
    $approvedBy = $input['approvedBy'] ?? $user['name'];

    if (empty($projectId) || empty($workerName) || $daysOrUnits <= 0 || $rate <= 0) {
        jsonResponse(false, null, 'پروژه، نام استادکار/کارگر، تعداد روز و نرخ روزانه الزامی هستند.', 400);
    }

    $db->beginTransaction();
    try {
        // حل نقص شماره ۳ اکسل: ایجاد خودکار سند پرداخت جهت درج مستقیم در هزینه واقعی پروژه
        $paymentVoucherId = generateUuid();
        $pvNo = 'PV-LAB-' . date('ymd') . '-' . rand(100, 999);

        $pvStmt = $db->prepare("
            INSERT INTO payment_vouchers (
                id, voucher_no, project_id, payee_type, payee_name,
                expense_category, amount, currency, exchange_rate, amount_in_base_afn,
                payment_method, payment_date, payment_status, approved_by,
                recorded_by_user_id, description
            ) VALUES (
                :id, :vno, :pid, 'labor_wage', :wname,
                'labor', :amt, 'AFN', 1.0, :amt,
                'cash', :dt, 'paid', :appr,
                :uid, :desc
            )
        ");
        $pvStmt->execute([
            'id' => $paymentVoucherId,
            'vno' => $pvNo,
            'pid' => $projectId,
            'wname' => $workerName,
            'amt' => $netPaid,
            'dt' => $date,
            'appr' => $approvedBy,
            'uid' => $user['id'],
            'desc' => "معاش کارکرد $daysOrUnits روز $workerName ($workType) با کسر مساعده $advance AFN"
        ]);

        // ثبت در جدول دستمزد کارگران
        $stmt = $db->prepare("
            INSERT INTO labor_payroll (
                id, payroll_number, project_id, worker_or_team_leader,
                work_type_description, days_or_work_units, rate_per_unit,
                gross_amount, advance_deduction, net_amount_paid, currency,
                payment_voucher_id, payroll_date, approved_by, is_fully_settled, notes
            ) VALUES (
                :id, :pno, :pid, :wname,
                :wtype, :units, :rate,
                :gross, :adv, :net, 'AFN',
                :pvid, :dt, :appr, 1, :notes
            )
        ");
        $stmt->execute([
            'id' => $id,
            'pno' => $payrollNo,
            'pid' => $projectId,
            'wname' => $workerName,
            'wtype' => $workType,
            'units' => $daysOrUnits,
            'rate' => $rate,
            'gross' => $gross,
            'adv' => $advance,
            'net' => $netPaid,
            'pvid' => $paymentVoucherId,
            'dt' => $date,
            'appr' => $approvedBy,
            'notes' => $input['notes'] ?? null
        ]);

        $db->commit();
        logAudit($db, $user['id'], $user['name'], 'create', 'labor', $id, "ثبت کارکرد $workerName خالص $netPaid AFN");
        jsonResponse(true, [
            'id' => $id, 
            'payrollNo' => $payrollNo, 
            'grossAmount' => $gross, 
            'netAmount' => $netPaid
        ], 'کارکرد کارگران ثبت و مبلغ خالص مستقیماً در مصارف پروژه درج شد.');
    } catch (Exception $e) {
        $db->rollBack();
        jsonResponse(false, null, 'خطا در ثبت معاش کارگران: ' . $e->getMessage(), 500);
    }
}
