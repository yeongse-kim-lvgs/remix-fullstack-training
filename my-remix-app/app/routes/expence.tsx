import { useState, useEffect } from "react";
import { Chart, Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

export default function ExpenseTrackerWithChart() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");

  const categories = ["食費", "家賃", "交通費", "エンターテインメント", "雑費"];

  // 初回レンダリング時に現在の日付を取得
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD形式
    setDate(today);
  }, []);

  useEffect(() => {
    const savedExpenses = localStorage.getItem("expenses");
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newExpense = {
      amount: Number(amount),
      category,
      description,
      date,
      isFixed,
    };

    if (editingIndex !== null) {
      const updatedExpenses = [...expenses];
      updatedExpenses[editingIndex] = newExpense;
      setExpenses(updatedExpenses);
      setEditingIndex(null);
    } else {
      setExpenses([...expenses, newExpense]);
    }

    setAmount("");
    setCategory("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]); // 提出後に現在の日付にリセット
    setIsFixed(false);
  };

  const handleDelete = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleEdit = (index) => {
    const expense = expenses[index];
    setAmount(expense.amount);
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date);
    setIsFixed(expense.isFixed);
    setEditingIndex(index);
  };

  const filteredExpenses = filterCategory
    ? expenses.filter((expense) => expense.category === filterCategory)
    : expenses;

  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // 日付ごとの支出を集計
  const dailyExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = expense.date;
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {});

  const dates = Object.keys(dailyExpenses);
  const amounts = Object.values(dailyExpenses);

  const barData = {
    labels: dates,
    datasets: [
      {
        label: "日ごとの支出",
        data: amounts,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // カテゴリーごとの支出を集計
  const categoryExpenses = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(categoryExpenses),
    datasets: [
      {
        label: "カテゴリー別支出",
        data: Object.values(categoryExpenses),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className='p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4'>
      <h1 className='text-2xl font-bold'>支出の記録</h1>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block'>金額:</label>
          <input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className='border border-gray-300 rounded p-2 w-full'
          />
        </div>
        <div>
          <label className='block'>カテゴリー:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className='border border-gray-300 rounded p-2 w-full'
          >
            <option value=''>選択してください</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className='block'>説明:</label>
          <input
            type='text'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className='border border-gray-300 rounded p-2 w-full'
          />
        </div>
        <div>
          <label className='block'>日付:</label>
          <input
            type='date'
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className='border border-gray-300 rounded p-2 w-full'
          />
        </div>
        <div className='flex items-center'>
          <label className='mr-4'>固定費かどうか:</label>
          <input
            type='checkbox'
            checked={isFixed}
            onChange={(e) => setIsFixed(e.target.checked)}
            className='h-4 w-4 text-blue-600'
          />
        </div>
        <button
          type='submit'
          className='bg-blue-500 text-white rounded p-2 mt-4 hover:bg-blue-600'
        >
          {editingIndex !== null ? "更新" : "保存"}
        </button>
      </form>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold'>支出フィルター</h2>
        <select
          onChange={(e) => setFilterCategory(e.target.value)}
          value={filterCategory}
          className='border border-gray-300 rounded p-2 w-full'
        >
          <option value=''>すべて</option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold'>支出一覧</h2>
        <ul className='space-y-2'>
          {filteredExpenses.map((expense, index) => (
            <li
              key={index}
              className='p-4 bg-gray-100 rounded-lg flex justify-between items-center'
            >
              <div>
                {expense.date}: {expense.category} - {expense.amount}円 (
                {expense.isFixed ? "固定費" : "変動費"})
              </div>
              <div className='space-x-2'>
                <button
                  onClick={() => handleEdit(index)}
                  className='bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600'
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className='bg-red-500 text-white p-1 rounded hover:bg-red-600'
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <h2 className='text-xl font-semibold mt-8'>
        合計支出金額: {totalAmount}円
      </h2>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold'>日ごとの支出グラフ</h2>
        <Bar data={barData} options={barOptions} />
      </div>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold'>カテゴリー別支出割合</h2>
        <Pie data={pieData} />
      </div>
    </div>
  );
}
