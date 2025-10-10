export function DashboardFooter() {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} SlotChain. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
