import { describe, it, expect } from '@jest/globals';

describe('Table Component Logic', () => {
  describe('Table Sorting', () => {
    interface SortConfig {
      column: string;
      direction: 'asc' | 'desc';
    }

    const sortData = <T extends Record<string, any>>(
      data: T[],
      config: SortConfig
    ): T[] => {
      return [...data].sort((a, b) => {
        const aVal = a[config.column];
        const bVal = b[config.column];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return config.direction === 'asc' ? comparison : -comparison;
      });
    };

    const toggleSortDirection = (current: 'asc' | 'desc'): 'asc' | 'desc' => {
      return current === 'asc' ? 'desc' : 'asc';
    };

    it('sorts data in ascending order', () => {
      const data = [
        { id: 1, name: 'Charlie' },
        { id: 2, name: 'Alice' },
        { id: 3, name: 'Bob' },
      ];
      
      const sorted = sortData(data, { column: 'name', direction: 'asc' });
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[1].name).toBe('Bob');
      expect(sorted[2].name).toBe('Charlie');
    });

    it('sorts data in descending order', () => {
      const data = [
        { id: 1, value: 10 },
        { id: 2, value: 30 },
        { id: 3, value: 20 },
      ];
      
      const sorted = sortData(data, { column: 'value', direction: 'desc' });
      expect(sorted[0].value).toBe(30);
      expect(sorted[1].value).toBe(20);
      expect(sorted[2].value).toBe(10);
    });

    it('toggles sort direction', () => {
      expect(toggleSortDirection('asc')).toBe('desc');
      expect(toggleSortDirection('desc')).toBe('asc');
    });

    it('handles equal values correctly', () => {
      const data = [
        { id: 1, score: 100, name: 'A' },
        { id: 2, score: 100, name: 'B' },
        { id: 3, score: 90, name: 'C' },
      ];
      
      const sorted = sortData(data, { column: 'score', direction: 'desc' });
      expect(sorted[0].score).toBe(100);
      expect(sorted[1].score).toBe(100);
      expect(sorted[2].score).toBe(90);
    });
  });

  describe('Table Pagination', () => {
    interface PaginationConfig {
      currentPage: number;
      pageSize: number;
      totalItems: number;
    }

    const getPaginationInfo = (config: PaginationConfig) => {
      const totalPages = Math.ceil(config.totalItems / config.pageSize);
      const startIndex = (config.currentPage - 1) * config.pageSize;
      const endIndex = Math.min(startIndex + config.pageSize, config.totalItems);
      
      return {
        currentPage: config.currentPage,
        pageSize: config.pageSize,
        totalPages,
        totalItems: config.totalItems,
        startIndex,
        endIndex,
        hasNext: config.currentPage < totalPages,
        hasPrevious: config.currentPage > 1,
        startItem: startIndex + 1,
        endItem: endIndex,
      };
    };

    const paginateData = <T>(data: T[], page: number, pageSize: number): T[] => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return data.slice(startIndex, endIndex);
    };

    it('calculates pagination info correctly', () => {
      const info = getPaginationInfo({
        currentPage: 2,
        pageSize: 10,
        totalItems: 45,
      });
      
      expect(info.totalPages).toBe(5);
      expect(info.startIndex).toBe(10);
      expect(info.endIndex).toBe(20);
      expect(info.startItem).toBe(11);
      expect(info.endItem).toBe(20);
    });

    it('handles last page correctly', () => {
      const info = getPaginationInfo({
        currentPage: 5,
        pageSize: 10,
        totalItems: 45,
      });
      
      expect(info.startIndex).toBe(40);
      expect(info.endIndex).toBe(45);
      expect(info.hasNext).toBe(false);
      expect(info.hasPrevious).toBe(true);
    });

    it('paginates data array', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      
      const page1 = paginateData(data, 1, 10);
      expect(page1).toHaveLength(10);
      expect(page1[0].id).toBe(1);
      expect(page1[9].id).toBe(10);
      
      const page3 = paginateData(data, 3, 10);
      expect(page3).toHaveLength(5);
      expect(page3[0].id).toBe(21);
    });
  });

  describe('Table Column Configuration', () => {
    interface Column<T> {
      key: keyof T;
      header: string;
      width?: number | string;
      sortable?: boolean;
      align?: 'left' | 'center' | 'right';
      render?: (value: any, row: T) => string;
    }

    const getColumnStyles = <T>(column: Column<T>) => {
      const alignments = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      };
      
      return {
        width: column.width || 'auto',
        textAlign: alignments[column.align || 'left'],
        cursor: column.sortable ? 'pointer' : 'default',
        userSelect: column.sortable ? 'none' : 'auto',
      };
    };

    it('applies column width', () => {
      const fixedWidth = getColumnStyles({ key: 'id', header: 'ID', width: 100 });
      expect(fixedWidth.width).toBe(100);
      
      const percentWidth = getColumnStyles({ key: 'name', header: 'Name', width: '30%' });
      expect(percentWidth.width).toBe('30%');
      
      const autoWidth = getColumnStyles({ key: 'email', header: 'Email' });
      expect(autoWidth.width).toBe('auto');
    });

    it('applies text alignment', () => {
      const left = getColumnStyles({ key: 'name', header: 'Name', align: 'left' });
      expect(left.textAlign).toBe('text-left');
      
      const center = getColumnStyles({ key: 'status', header: 'Status', align: 'center' });
      expect(center.textAlign).toBe('text-center');
      
      const right = getColumnStyles({ key: 'amount', header: 'Amount', align: 'right' });
      expect(right.textAlign).toBe('text-right');
    });

    it('handles sortable columns', () => {
      const sortable = getColumnStyles({ key: 'date', header: 'Date', sortable: true });
      expect(sortable.cursor).toBe('pointer');
      expect(sortable.userSelect).toBe('none');
      
      const notSortable = getColumnStyles({ key: 'actions', header: 'Actions' });
      expect(notSortable.cursor).toBe('default');
    });
  });

  describe('Table Selection', () => {
    interface SelectionState {
      selectedRows: Set<string | number>;
      allRowsOnPage: (string | number)[];
      totalRows: number;
    }

    const getSelectionInfo = (state: SelectionState) => {
      const selectedCount = state.selectedRows.size;
      const pageRowCount = state.allRowsOnPage.length;
      const allPageRowsSelected = state.allRowsOnPage.every(id => 
        state.selectedRows.has(id)
      );
      
      return {
        selectedCount,
        allSelected: selectedCount === state.totalRows,
        allPageSelected: allPageRowsSelected,
        someSelected: selectedCount > 0 && selectedCount < state.totalRows,
        somePageSelected: !allPageRowsSelected && 
          state.allRowsOnPage.some(id => state.selectedRows.has(id)),
      };
    };

    const toggleRowSelection = (
      selectedRows: Set<string | number>,
      rowId: string | number
    ): Set<string | number> => {
      const newSelection = new Set(selectedRows);
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      return newSelection;
    };

    const toggleAllPageRows = (
      selectedRows: Set<string | number>,
      pageRows: (string | number)[]
    ): Set<string | number> => {
      const newSelection = new Set(selectedRows);
      const allSelected = pageRows.every(id => selectedRows.has(id));
      
      if (allSelected) {
        pageRows.forEach(id => newSelection.delete(id));
      } else {
        pageRows.forEach(id => newSelection.add(id));
      }
      
      return newSelection;
    };

    it('tracks selection state', () => {
      const state: SelectionState = {
        selectedRows: new Set([1, 2, 3]),
        allRowsOnPage: [1, 2, 3, 4, 5],
        totalRows: 10,
      };
      
      const info = getSelectionInfo(state);
      expect(info.selectedCount).toBe(3);
      expect(info.allSelected).toBe(false);
      expect(info.someSelected).toBe(true);
      expect(info.somePageSelected).toBe(true);
    });

    it('toggles individual row selection', () => {
      const selected = new Set([1, 2]);
      
      const afterAdd = toggleRowSelection(selected, 3);
      expect(afterAdd.has(3)).toBe(true);
      expect(afterAdd.size).toBe(3);
      
      const afterRemove = toggleRowSelection(afterAdd, 2);
      expect(afterRemove.has(2)).toBe(false);
      expect(afterRemove.size).toBe(2);
    });

    it('toggles all page rows', () => {
      const selected = new Set([1, 2]);
      const pageRows = [1, 2, 3, 4, 5];
      
      // Select remaining rows
      const afterSelectAll = toggleAllPageRows(selected, pageRows);
      expect(afterSelectAll.size).toBe(5);
      pageRows.forEach(id => {
        expect(afterSelectAll.has(id)).toBe(true);
      });
      
      // Deselect all
      const afterDeselectAll = toggleAllPageRows(afterSelectAll, pageRows);
      expect(afterDeselectAll.size).toBe(0);
    });
  });

  describe('Table Filtering', () => {
    interface FilterConfig {
      column: string;
      value: any;
      operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between';
    }

    const applyFilter = <T extends Record<string, any>>(
      data: T[],
      filter: FilterConfig
    ): T[] => {
      return data.filter(row => {
        const cellValue = row[filter.column];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return cellValue === filterValue;
          case 'contains':
            return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'startsWith':
            return String(cellValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(cellValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'gt':
            return cellValue > filterValue;
          case 'lt':
            return cellValue < filterValue;
          case 'between':
            return cellValue >= filterValue[0] && cellValue <= filterValue[1];
          default:
            return true;
        }
      });
    };

    it('filters with equals operator', () => {
      const data = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' },
      ];
      
      const filtered = applyFilter(data, {
        column: 'status',
        value: 'active',
        operator: 'equals',
      });
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(row => row.status === 'active')).toBe(true);
    });

    it('filters with contains operator', () => {
      const data = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Bob Johnson' },
      ];
      
      const filtered = applyFilter(data, {
        column: 'name',
        value: 'john',
        operator: 'contains',
      });
      
      expect(filtered).toHaveLength(2);
    });

    it('filters with numeric operators', () => {
      const data = [
        { id: 1, age: 25 },
        { id: 2, age: 35 },
        { id: 3, age: 45 },
      ];
      
      const gt30 = applyFilter(data, {
        column: 'age',
        value: 30,
        operator: 'gt',
      });
      
      expect(gt30).toHaveLength(2);
      expect(gt30.every(row => row.age > 30)).toBe(true);
    });

    it('filters with between operator', () => {
      const data = [
        { id: 1, price: 10 },
        { id: 2, price: 25 },
        { id: 3, price: 50 },
      ];
      
      const filtered = applyFilter(data, {
        column: 'price',
        value: [20, 40],
        operator: 'between',
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].price).toBe(25);
    });
  });

  describe('Table Row Actions', () => {
    interface RowAction<T> {
      label: string;
      icon?: string;
      onClick: (row: T) => void;
      disabled?: (row: T) => boolean;
      hidden?: (row: T) => boolean;
      variant?: 'default' | 'danger';
    }

    const getVisibleActions = <T>(
      actions: RowAction<T>[],
      row: T
    ): RowAction<T>[] => {
      return actions.filter(action => {
        if (action.hidden && action.hidden(row)) {
          return false;
        }
        return true;
      });
    };

    const isActionDisabled = <T>(
      action: RowAction<T>,
      row: T
    ): boolean => {
      if (action.disabled) {
        return action.disabled(row);
      }
      return false;
    };

    it('filters visible actions', () => {
      const actions: RowAction<{ status: string }>[] = [
        { label: 'Edit', onClick: () => {} },
        { 
          label: 'Delete', 
          onClick: () => {},
          hidden: (row) => row.status === 'protected',
        },
        {
          label: 'Archive',
          onClick: () => {},
          hidden: (row) => row.status === 'archived',
        },
      ];
      
      const visibleForActive = getVisibleActions(actions, { status: 'active' });
      expect(visibleForActive).toHaveLength(3);
      
      const visibleForProtected = getVisibleActions(actions, { status: 'protected' });
      expect(visibleForProtected).toHaveLength(2);
      expect(visibleForProtected.find(a => a.label === 'Delete')).toBeUndefined();
    });

    it('checks action disabled state', () => {
      const action: RowAction<{ locked: boolean }> = {
        label: 'Edit',
        onClick: () => {},
        disabled: (row) => row.locked,
      };
      
      expect(isActionDisabled(action, { locked: true })).toBe(true);
      expect(isActionDisabled(action, { locked: false })).toBe(false);
    });
  });

  describe('Table Responsive Behavior', () => {
    const getResponsiveConfig = (screenWidth: number) => {
      const breakpoints = {
        mobile: 640,
        tablet: 1024,
        desktop: 1280,
      };
      
      const isMobile = screenWidth < breakpoints.mobile;
      const isTablet = screenWidth >= breakpoints.mobile && screenWidth < breakpoints.tablet;
      const isDesktop = screenWidth >= breakpoints.desktop;
      
      return {
        layout: isMobile ? 'stacked' : 'table',
        showHeaders: !isMobile,
        actionsPosition: isMobile ? 'dropdown' : 'inline',
        paginationSize: isMobile ? 'compact' : 'full',
        columnsToHide: isMobile ? ['email', 'phone'] : isTablet ? ['phone'] : [],
      };
    };

    it('uses stacked layout on mobile', () => {
      const config = getResponsiveConfig(375);
      expect(config.layout).toBe('stacked');
      expect(config.showHeaders).toBe(false);
      expect(config.actionsPosition).toBe('dropdown');
    });

    it('uses table layout on desktop', () => {
      const config = getResponsiveConfig(1440);
      expect(config.layout).toBe('table');
      expect(config.showHeaders).toBe(true);
      expect(config.actionsPosition).toBe('inline');
    });

    it('hides columns based on screen size', () => {
      const mobile = getResponsiveConfig(375);
      expect(mobile.columnsToHide).toContain('email');
      expect(mobile.columnsToHide).toContain('phone');
      
      const tablet = getResponsiveConfig(768);
      expect(tablet.columnsToHide).toContain('phone');
      expect(tablet.columnsToHide).not.toContain('email');
      
      const desktop = getResponsiveConfig(1440);
      expect(desktop.columnsToHide).toHaveLength(0);
    });
  });

  describe('Table Export', () => {
    const exportToCSV = <T extends Record<string, any>>(
      data: T[],
      columns: { key: keyof T; header: string }[]
    ): string => {
      const headers = columns.map(col => col.header).join(',');
      const rows = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value).replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      );
      
      return [headers, ...rows].join('\n');
    };

    it('exports data to CSV format', () => {
      const data = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ];
      
      const columns = [
        { key: 'id' as const, header: 'ID' },
        { key: 'name' as const, header: 'Name' },
        { key: 'email' as const, header: 'Email' },
      ];
      
      const csv = exportToCSV(data, columns);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('ID,Name,Email');
      expect(lines[1]).toBe('1,John,john@example.com');
      expect(lines[2]).toBe('2,Jane,jane@example.com');
    });

    it('handles values with commas', () => {
      const data = [
        { id: 1, name: 'Doe, John', address: '123 Main St' },
      ];
      
      const columns = [
        { key: 'id' as const, header: 'ID' },
        { key: 'name' as const, header: 'Name' },
        { key: 'address' as const, header: 'Address' },
      ];
      
      const csv = exportToCSV(data, columns);
      expect(csv).toContain('"Doe, John"');
    });
  });
});