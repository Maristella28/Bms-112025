<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Household Survey Form</title>
    <style>
        @page {
            margin: 20mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #2563eb;
        }
        .header h2 {
            margin: 5px 0 0 0;
            font-size: 18px;
            color: #64748b;
            font-weight: normal;
        }
        .survey-type-badge {
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 20px auto;
            text-align: center;
            display: inline-block;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .household-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }
        .household-info h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #1e293b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
        }
        .info-grid {
            width: 100%;
            font-size: 11px;
        }
        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }
        .info-item {
            display: table-row;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
        }
        .info-value {
            color: #1e293b;
        }
        .survey-details {
            margin-bottom: 25px;
        }
        .survey-details h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #1e293b;
        }
        .survey-meta {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 15px;
        }
        .custom-message {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 10px;
            margin-bottom: 25px;
            font-size: 11px;
            color: #78350f;
        }
        .questions-section {
            margin-bottom: 25px;
        }
        .questions-section h3 {
            margin: 0 0 15px 0;
            font-size: 14px;
            color: #1e293b;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }
        .question-item {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px dashed #cbd5e1;
        }
        .question-item:last-child {
            border-bottom: none;
        }
        .question-number {
            font-weight: bold;
            color: #2563eb;
            margin-right: 8px;
        }
        .question-text {
            margin-bottom: 10px;
            color: #1e293b;
        }
        .answer-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            min-height: 40px;
            padding: 8px;
            margin-top: 5px;
            background-color: #ffffff;
        }
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e2e8f0;
            font-size: 10px;
            color: #64748b;
            text-align: center;
        }
        .expiry-notice {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 10px;
            margin-top: 20px;
            font-size: 11px;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>BARANGAY E-GOVERNANCE SYSTEM</h1>
        <h2>Household Verification Survey Form</h2>
        <div class="survey-type-badge">
            {{ $survey_type_label ?? 'Survey Form' }}
        </div>
    </div>

    <div class="household-info">
        <h3>Household Information</h3>
        <table class="info-grid" style="width: 100%; border-collapse: collapse;">
            <tr class="info-item">
                <td class="info-label" style="width: 40%; padding: 5px 0;">Household No:</td>
                <td class="info-value" style="padding: 5px 0;">{{ $household->household_no ?? 'N/A' }}</td>
            </tr>
            <tr class="info-item">
                <td class="info-label" style="width: 40%; padding: 5px 0;">Head of Household:</td>
                <td class="info-value" style="padding: 5px 0;">{{ $household->head_full_name ?? 'N/A' }}</td>
            </tr>
            <tr class="info-item">
                <td class="info-label" style="width: 40%; padding: 5px 0;">Address:</td>
                <td class="info-value" style="padding: 5px 0;">{{ $household->address ?? 'N/A' }}</td>
            </tr>
            <tr class="info-item">
                <td class="info-label" style="width: 40%; padding: 5px 0;">Contact:</td>
                <td class="info-value" style="padding: 5px 0;">{{ $household->mobilenumber ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="survey-details">
        <h3>Survey Details</h3>
        <div class="survey-meta">
            @if($sent_at)
            <strong>Date Issued:</strong> {{ $sent_at }}<br>
            @endif
            @if($expires_at)
            <strong>Expires On:</strong> {{ $expires_at }}
            @endif
        </div>

        @if($custom_message)
        <div class="custom-message">
            <strong>Special Message:</strong><br>
            {{ $custom_message }}
        </div>
        @endif
    </div>

    <div class="questions-section">
        <h3>Survey Questions</h3>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 15px;">
            Please answer each question below. Provide detailed responses in the space provided.
        </p>

        @if(!empty($questions) && is_array($questions))
            @foreach($questions as $index => $question)
            <div class="question-item">
                <div class="question-text">
                    <span class="question-number">{{ $index + 1 }}.</span>
                    {{ $question ?? 'Question not available' }}
                </div>
                <div class="answer-box">
                    &nbsp;
                </div>
            </div>
            @endforeach
        @else
            <p style="color: #ef4444; font-style: italic;">No questions available for this survey.</p>
        @endif
    </div>

    @if($expires_at)
    <div class="expiry-notice">
        <strong>Important:</strong> This survey form must be completed and returned by {{ $expires_at }}.
    </div>
    @endif

    <div class="footer">
        <p><strong>Instructions:</strong> Please fill out this form completely and return it to the Barangay Office.</p>
        <p>For questions or assistance, please contact the Barangay Office.</p>
        <p style="margin-top: 10px;">Generated on {{ date('F j, Y \a\t g:i A') }}</p>
    </div>
</body>
</html>

