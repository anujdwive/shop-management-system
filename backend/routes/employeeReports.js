const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Sale = require('../models/Sale');
const Shop = require('../models/Shop');
const { protect } = require('../middleware/auth');

// @route   GET /api/reports/employee/performance/:shopId
// @desc    Get employee performance report
// @access  Private
router.get('/performance/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month', year, limit = 20 } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view employee reports for this shop' });
    }

    // Calculate date range
    let startDate, endDate;

    if (period === 'month') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = new Date().getMonth();
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor((now.getMonth() + 3) / 3);
      startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const employees = await Employee.find({ shopId, status: 'active' })
      .populate('userId', 'name email phone')
      .sort({ joinDate: -1 });

    const employeePerformance = await Promise.all(employees.map(async (employee) => {
      // Get sales data
      const salesData = await Sale.aggregate([
        {
          $match: {
            shopId,
            employeeId: employee._id,
            saleDate: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            totalProfit: { $sum: '$profit' },
            totalCommission: { $sum: '$commissionEarned' },
            totalItems: { $sum: { $size: '$items' } },
            averageOrderValue: { $avg: '$totalAmount' }
          }
        }
      ]);

      const sales = salesData[0] || { totalSales: 0, totalRevenue: 0, totalProfit: 0, totalCommission: 0, totalItems: 0, averageOrderValue: 0 };

      // Get attendance data
      const attendanceData = await Attendance.getMonthlyAttendanceSummary(shopId, startDate.getFullYear(), startDate.getMonth() + 1);

      // Calculate target achievement
      const targetAchievement = employee.salesTarget > 0
        ? ((sales.totalRevenue / employee.salesTarget) * 100).toFixed(1)
        : null;

      return {
        employeeId: employee._id,
        employeeId: employee.employeeId,
        name: employee.userId?.name || 'N/A',
        email: employee.userId?.email || 'N/A',
        phone: employee.userId?.phone || 'N/A',
        designation: employee.designation,
        joinDate: employee.joinDate,
        salary: employee.salary,
        salesTarget: employee.salesTarget,
        commissionRate: employee.commissionRate,
        performance: {
          totalSales: sales.totalSales,
          totalRevenue: sales.totalRevenue,
          totalProfit: sales.totalProfit,
          totalCommission: sales.totalCommission,
          commissionEarned: employee.totalCommission,
          totalItemsSold: sales.totalItems,
          averageOrderValue: sales.averageOrderValue,
          targetAchievement: targetAchievement ? parseFloat(targetAchievement) : null,
          isTargetMet: employee.salesTarget > 0 ? sales.totalRevenue >= employee.salesTarget : null
        },
        attendance: {
          totalDays: attendanceData.totalDays,
          presentDays: attendanceData.presentDays,
          absentDays: attendanceData.absentDays,
          lateDays: attendanceData.lateDays,
          attendanceRate: attendanceData.totalDays > 0
            ? ((attendanceData.presentDays / attendanceData.totalDays) * 100).toFixed(1)
            : 0,
          totalWorkHours: attendanceData.totalWorkHours,
          totalOvertimeHours: attendanceData.totalOvertimeHours
        },
        earnings: {
          salary: employee.salary,
          commission: sales.totalCommission,
          totalEarnings: employee.salary + sales.totalCommission
        },
        efficiency: {
          salesPerDay: attendanceData.presentDays > 0
            ? (sales.totalRevenue / attendanceData.presentDays).toFixed(0)
            : 0,
          revenuePerHour: attendanceData.totalWorkHours > 0
            ? (sales.totalRevenue / attendanceData.totalWorkHours).toFixed(0)
            : 0
        }
      };
    }));

    // Sort by performance
    employeePerformance.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue);

    // Find top performer
    const topPerformer = employeePerformance.length > 0 ? employeePerformance[0] : null;

    // Calculate team stats
    const teamStats = employeePerformance.reduce((acc, emp) => ({
      totalRevenue: acc.totalRevenue + emp.performance.totalRevenue,
      totalProfit: acc.totalProfit + emp.performance.totalProfit,
      totalSales: acc.totalSales + emp.performance.totalSales,
      totalCommission: acc.totalCommission + emp.performance.totalCommission,
      totalSalary: acc.totalSalary + emp.earnings.salary
    }), { totalRevenue: 0, totalProfit: 0, totalSales: 0, totalCommission: 0, totalSalary: 0 });

    res.json({
      shopId,
      period,
      year: year ? parseInt(year) : new Date().getFullYear(),
      dateRange: { startDate, endDate },
      summary: {
        totalEmployees: employeePerformance.length,
        totalRevenue: teamStats.totalRevenue,
        totalProfit: teamStats.totalProfit,
        totalSales: teamStats.totalSales,
        totalCommission: teamStats.totalCommission,
        totalSalaryCost: teamStats.totalSalary,
        netTeamProfit: teamStats.totalProfit + teamStats.totalCommission - teamStats.totalSalary,
        averageRevenuePerEmployee: employeePerformance.length > 0
          ? (teamStats.totalRevenue / employeePerformance.length).toFixed(0)
          : 0,
        averageAttendanceRate: employeePerformance.length > 0
          ? (employeePerformance.reduce((sum, e) => sum + parseFloat(e.attendance.attendanceRate), 0) / employeePerformance.length).toFixed(1)
          : 0
      },
      topPerformer,
      employees: employeePerformance.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/employee/attendance/:shopId
// @desc    Get employee attendance report
// @access  Private
router.get('/attendance/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month', year } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view employee reports for this shop' });
    }

    // Calculate date range
    let startDate, endDate;

    if (period === 'month') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = new Date().getMonth();
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor((now.getMonth() + 3) / 3);
      startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
    } else {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    const employees = await Employee.find({ shopId, status: 'active' })
      .populate('userId', 'name')
      .sort('name');

    const employeeAttendance = await Promise.all(employees.map(async (employee) => {
      const attendance = await Attendance.find({
        employeeId: employee._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      const summary = attendance.reduce((acc, att) => {
        if (att.status === 'present') acc.present += 1;
        else if (att.status === 'absent') acc.absent += 1;
        else if (att.status === 'late') acc.late += 1;
        else if (att.status === 'on_leave') acc.onLeave += 1;
        else if (att.status === 'half_day') acc.halfDay += 1;

        acc.totalWorkHours += att.workHours || 0;
        acc.totalOvertimeHours += att.overtimeHours || 0;
        return acc;
      }, { total: 0, present: 0, absent: 0, late: 0, onLeave: 0, halfDay: 0, totalWorkHours: 0, totalOvertimeHours: 0 });

      const attendanceRate = summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : 0;

      return {
        employeeId: employee._id,
        employeeId: employee.employeeId,
        name: employee.userId?.name || 'N/A',
        designation: employee.designation,
        attendance: {
          total: summary.total,
          present: summary.present,
          absent: summary.absent,
          late: summary.late,
          onLeave: summary.onLeave,
          halfDay: summary.halfDay,
          attendanceRate: parseFloat(attendanceRate),
          totalWorkHours: summary.totalWorkHours.toFixed(1),
          totalOvertimeHours: summary.totalOvertimeHours.toFixed(1),
          averageHoursPerDay: summary.total > 0 ? (summary.totalWorkHours / summary.total).toFixed(1) : 0
        },
        punctuality: {
          onTimePercentage: summary.total > 0 && (summary.present + summary.late) > 0
            ? ((summary.present / (summary.present + summary.late)) * 100).toFixed(1)
            : 0
        }
      };
    }));

    // Calculate team attendance
    const teamAttendance = employeeAttendance.reduce((acc, emp) => ({
      totalEmployees: acc.totalEmployees + 1,
      totalDays: acc.totalDays + emp.attendance.total,
      totalPresent: acc.totalPresent + emp.attendance.present,
      totalAbsent: acc.totalAbsent + emp.attendance.absent,
      totalLate: acc.totalLate + emp.attendance.late,
      totalWorkHours: acc.totalWorkHours + parseFloat(emp.attendance.totalWorkHours),
      totalOvertimeHours: acc.totalOvertimeHours + parseFloat(emp.attendance.totalOvertimeHours)
    }), { totalEmployees: 0, totalDays: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, totalWorkHours: 0, totalOvertimeHours: 0 });

    const teamAttendanceRate = teamAttendance.totalDays > 0 && teamAttendance.totalPresent > 0
      ? ((teamAttendance.totalPresent / teamAttendance.totalDays) / teamAttendance.totalEmployees * 100)
      : 0;

    res.json({
      shopId,
      period,
      year: year ? parseInt(year) : new Date().getFullYear(),
      dateRange: { startDate, endDate },
      team: {
        totalEmployees: teamAttendance.totalEmployees,
        attendanceRate: teamAttendanceRate.toFixed(1),
        totalPresent: teamAttendance.totalPresent,
        totalAbsent: teamAttendance.totalAbsent,
        totalLate: teamAttendance.totalLate,
        averageWorkHours: teamAttendance.totalDays > 0
          ? (teamAttendance.totalWorkHours / teamAttendance.totalEmployees).toFixed(1)
          : 0,
        averageOvertimeHours: teamAttendance.totalDays > 0
          ? (teamAttendance.totalOvertimeHours / teamAttendance.totalEmployees).toFixed(1)
          : 0
      },
      employees: employeeAttendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reports/employee/efficiency/:shopId
// @desc    Get employee efficiency analysis
// @access  Private
router.get('/efficiency/:shopId', protect, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month', year } = req.query;

    // Check access
    if (req.user.role !== 'owner' && !req.user.shops.includes(shopId)) {
      return res.status(403).json({ message: 'Not authorized to view employee reports for this shop' });
    }

    // Calculate date range
    let startDate, endDate;

    if (period === 'month') {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = new Date().getMonth();
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor((now.getMonth() + 3) / 3);
      startDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
    } else {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    const employees = await Employee.find({ shopId, status: 'active' })
      .populate('userId', 'name')
      .sort({ joinDate: -1 });

    const employeeEfficiency = await Promise.all(employees.map(async (employee) => {
      // Get sales data
      const salesData = await Sale.aggregate([
        {
          $match: {
            shopId,
            employeeId: employee._id,
            saleDate: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalProfit: { $sum: '$profit' },
            totalSales: { $sum: 1 }
          }
        }
      ]);

      const sales = salesData[0] || { totalRevenue: 0, totalProfit: 0, totalSales: 0 };

      // Get attendance data
      const attendanceData = await Attendance.getMonthlyAttendanceSummary(shopId, startDate.getFullYear(), startDate.getMonth() + 1);

      // Find this employee's attendance
      const attendanceSummary = await Attendance.find({
        employeeId: employee._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const presentDays = attendanceSummary.filter(a => a.status === 'present').length;
      const totalWorkHours = attendanceSummary.reduce((sum, a) => sum + (a.workHours || 0), 0);

      // Calculate efficiency metrics
      const revenuePerHour = totalWorkHours > 0 ? (sales.totalRevenue / totalWorkHours) : 0;
      const profitPerHour = totalWorkHours > 0 ? (sales.totalProfit / totalWorkHours) : 0;
      const salesPerDay = presentDays > 0 ? (sales.totalSales / presentDays) : 0;
      const revenuePerDay = presentDays > 0 ? (sales.totalRevenue / presentDays) : 0;

      // Calculate cost vs revenue
      const laborCost = employee.salaryType === 'monthly'
        ? (employee.salary / 30) * presentDays
        : employee.salaryType === 'daily'
          ? employee.salary * presentDays
          : 0;

      const profitAfterLabor = sales.totalProfit - laborCost;
      const profitMargin = sales.totalRevenue > 0 ? ((sales.totalProfit / sales.totalRevenue) * 100) : 0;

      return {
        employeeId: employee._id,
        employeeId: employee.employeeId,
        name: employee.userId?.name || 'N/A',
        designation: employee.designation,
        efficiency: {
          totalRevenue: sales.totalRevenue,
          totalProfit: sales.totalProfit,
          totalSales: sales.totalSales,
          presentDays,
          totalWorkHours: totalWorkHours.toFixed(1),
          revenuePerHour: revenuePerHour.toFixed(0),
          profitPerHour: profitPerHour.toFixed(0),
          salesPerDay: salesPerDay.toFixed(1),
          revenuePerDay: revenuePerDay.toFixed(0),
          laborCost: laborCost.toFixed(0),
          profitAfterLabor: profitAfterLabor.toFixed(0),
          roi: laborCost > 0 ? (((profitAfterLabor) / laborCost) * 100).toFixed(1) : 0,
          profitMargin: parseFloat(profitMargin.toFixed(1))
        },
        performance: {
          salesTarget: employee.salesTarget,
          targetAchievement: employee.salesTarget > 0
            ? ((sales.totalRevenue / employee.salesTarget) * 100).toFixed(1)
            : null,
          commissionEarned: employee.totalCommission,
          commissionRate: employee.commissionRate
        }
      };
    }));

    // Sort by efficiency (total profit)
    employeeEfficiency.sort((a, b) => b.efficiency.totalProfit - a.efficiency.totalProfit);

    // Find most efficient employee
    const mostEfficient = employeeEfficiency.length > 0 ? employeeEfficiency[0] : null;

    // Calculate team efficiency
    const teamStats = employeeEfficiency.reduce((acc, emp) => ({
      totalRevenue: acc.totalRevenue + emp.efficiency.totalRevenue,
      totalProfit: acc.totalProfit + emp.efficiency.totalProfit,
      totalSales: acc.totalSales + emp.efficiency.totalSales,
      totalWorkHours: acc.totalWorkHours + parseFloat(emp.efficiency.totalWorkHours),
      totalLaborCost: acc.totalLaborCost + parseFloat(emp.efficiency.laborCost)
    }), { totalRevenue: 0, totalProfit: 0, totalSales: 0, totalWorkHours: 0, totalLaborCost: 0 });

    const teamProfitAfterLabor = teamStats.totalProfit - teamStats.totalLaborCost;
    const teamROI = teamStats.totalLaborCost > 0
      ? ((teamProfitAfterLabor / teamStats.totalLaborCost) * 100)
      : 0;

    res.json({
      shopId,
      period,
      year: year ? parseInt(year) : new Date().getFullYear(),
      dateRange: { startDate, endDate },
      team: {
        totalEmployees: employeeEfficiency.length,
        totalRevenue: teamStats.totalRevenue,
        totalProfit: teamStats.totalProfit,
        totalSales: teamStats.totalSales,
        totalWorkHours: teamStats.totalWorkHours.toFixed(1),
        totalLaborCost: teamStats.totalLaborCost.toFixed(0),
        profitAfterLabor: teamProfitAfterLabor.toFixed(0),
        teamROI: parseFloat(teamROI.toFixed(1)),
        averageRevenuePerHour: teamStats.totalWorkHours > 0
          ? (teamStats.totalRevenue / teamStats.totalWorkHours).toFixed(0)
          : 0
      },
      mostEfficient,
      employees: employeeEfficiency
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
