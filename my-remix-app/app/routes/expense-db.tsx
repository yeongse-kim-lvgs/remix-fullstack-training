import { useLoaderData } from "@remix-run/react"; // 修正
import { LoaderFunction, json } from "@remix-run/node";
import { useState, useEffect } from "react";
import { Chart, Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import dayjs from "dayjs";
import { createConnection } from "../../db/connection";

// CategoryをEnumで定義
enum Category {
  Food = "食費",
  Rent = "家賃",
  Transport = "交通費",
  Entertainment = "エンターテインメント",
  Misc = "雑費",
}

// User型を定義
interface User {
  id: number;
  name: string;
}

// Item型を定義
interface Item {
  name: string;
  price: number;
}

// Expense型にUserとItem型を入れる
interface Expense {
  id: number;
  amount: number;
  category: Category;
  description: string;
  date: string; // YYYY-MM-DD形式の文字列
  isFixed: boolean;
  user: User; // User型をプロパティとして含む
  items: Item[]; // 空配列として初期化するためオプショナルではない
}

// Loader関数
export const loader: LoaderFunction = async () => {
  const connection = await createConnection();

  // expensesテーブルとusersテーブルのデータをJOINして取得
  const [rows] = await connection.execute(`
    SELECT expenses.*, users.name as user_name 
    FROM expenses 
    JOIN users ON expenses.user_id = users.id
  `);

  await connection.end();

  return json(rows);
};

export default function ExpenseTrackerWithChart() {
  // データベースから取得したデータをloaderから取得
  const expensesFromDb = useLoaderData<Expense[]>();

  // データベースのデータをstateに設定
  const [expenses, setExpenses] = useState<Expense[]>(expensesFromDb);

  // useLoaderDataからのデータとstateを同期
  useEffect(() => {
    setExpenses(expensesFromDb);
  }, [expensesFromDb]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | "">(""); // 初期状態は空文字
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [isFixed, setIsFixed] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState<{
    [date: string]: number;
  }>({});

  const categories = Object.values(Category);

  // 初回レンダリング時に現在の日付を取得
  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    setDate(today);
  }, []);

  // フィルタリングされた支出の計算、合計金額と日ごとの集計をuseEffectで管理
  useEffect(() => {
    // フィルタリング処理
    const filtered = filterCategory
      ? expenses.filter((expense) => expense.category === filterCategory)
      : expenses;
    setFilteredExpenses(filtered);

    // 合計金額を計算
    const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalAmount(total);

    // 日付ごとの支出を集計
    const dailyTotals = filtered.reduce((acc, expense) => {
      const date = expense.date;
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as { [date: string]: number });
    setDailyExpenses(dailyTotals);
  }, [expenses, filterCategory]); // 依存配列にexpensesとfilterCategoryを設定

  const handleSubmit = (e) => {
    e.preventDefault();

    if (amount === "") return; // 空のまま送信されないようにする

    const newExpense: Expense = {
      id: expenses.length + 1, // 仮のID
      amount: Number(amount), // 入力された金額を数値に変換
      category: category as Category,
      description,
      date,
      isFixed,
      user: {
        id: 1, // 仮のユーザーID
        name: "John Doe", // 仮のユーザー名
      },
      items: [], // 空の配列で初期化
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
    setDate(dayjs().format("YYYY-MM-DD"));
    setIsFixed(false);
  };

  const handleDelete = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleEdit = (index) => {
    const expense = expenses[index];
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date);
    setIsFixed(expense.isFixed);
    setEditingIndex(index);
  };

  const dates = Object.keys(dailyExpenses);
  const amounts = Object.values(dailyExpenses);

  interface ExpenseData {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  }

  const dailyExpensesData: ExpenseData = {
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

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // カテゴリーごとの支出を集計
  const categoryExpenses: CategoryExpenses = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as CategoryExpenses);

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
        {/* フォーム部分の実装 */}
      </form>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold'>支出一覧</h2>
        {/* 支出一覧の表示 */}
      </div>

      <h2 className='text-xl font-semibold mt-8'>
        合計支出金額: {totalAmount}円
      </h2>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold'>日ごとの支出グラフ</h2>
        <Bar data={dailyExpensesData} options={chartOptions} />
      </div>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold'>カテゴリー別支出割合</h2>
        <Pie data={pieData} />
      </div>
    </div>
  );
}
