import { useCallback, useRef } from 'react';
import type { AdvancedFilterModel, FilterModel, GridApi } from 'ag-grid-community';
import { SelectedFilterType, type FilterOption } from '../appInterfaces/grid/gridInterfaces';
import * as _ from 'lodash-es';

type GetGridApi = () => GridApi | null | undefined;

interface UseFilterTemplatesParams {
  getGridApi: GetGridApi;
  filterOptions: FilterOption[];
  setFilterOptions: (opts: FilterOption[]) => void;
  selectedFilter: FilterOption | null;
  setSelectedFilter: (opt: FilterOption | null) => void;
  setShowAdvancedFilter: (show: boolean) => void;
  setAdvancedFilterState: (state: AdvancedFilterModel | null) => void;
  onAfterChange?: () => void; // optional state sync callback (e.g., handleGridStateChange)
  canSave?: () => boolean; // optional guard for save (e.g., require selectedObject)
  onError?: (operation: 'save' | 'delete', error: any) => void; // optional error reporter
}

export function useFilterTemplates({
  getGridApi,
  filterOptions,
  setFilterOptions,
  selectedFilter,
  setSelectedFilter,
  setShowAdvancedFilter,
  setAdvancedFilterState,
  onAfterChange,
  canSave,
  onError,
}: UseFilterTemplatesParams) {
  // Shared ref for save filter dialog to distinguish model source
  const selectedFilterType = useRef<SelectedFilterType>(null);

  const onFilterNameCreated = useCallback(
    async (filterName: string) => {
      try {
        if (!filterName || filterName.trim() === '') return;
        if (canSave && !canSave()) return;

        const api = getGridApi();
        if (!api) return;

        let fModel: AdvancedFilterModel | FilterModel = {};

        if (selectedFilterType.current === SelectedFilterType.AdvancedFilterModel) {
          fModel = api.getAdvancedFilterModel() as AdvancedFilterModel;
        }

        if (selectedFilterType.current === SelectedFilterType.FilterModel) {
          fModel = api.getFilterModel() as FilterModel;
        }

        const filterType = selectedFilterType.current;
        if (!filterType) return;

        const newFilterOption: FilterOption = filterType === SelectedFilterType.AdvancedFilterModel
          ? { type: filterType, name: filterName, filterModel: fModel as AdvancedFilterModel }
          : { type: filterType, name: filterName, filterModel: fModel as FilterModel };

        const filterOptionsCopy = _.cloneDeep(filterOptions);
        filterOptionsCopy.push(newFilterOption);
        setFilterOptions(filterOptionsCopy);

        if (onAfterChange) onAfterChange();
      } catch (err) {
        if (onError) onError('save', err);
      }
    },
    [canSave, filterOptions, getGridApi, onAfterChange, onError, setFilterOptions]
  );

  /**
   * @deprecated Use deleteFilter instead with the unified confirmation dialog
   */
  const onFilterDeleteConfirmation = useCallback(
    async (confirmed: boolean) => {
      if (!confirmed) return;
      try {
        const filterOptionsCopy = _.cloneDeep(filterOptions);
        const newFilterOptions = filterOptionsCopy.filter(
          (o: FilterOption) => o.name !== selectedFilter?.name
        );

        setFilterOptions(newFilterOptions);
        setSelectedFilter(null);
        setShowAdvancedFilter(false);
        setAdvancedFilterState(null);

        if (onAfterChange) onAfterChange();
      } catch (err) {
        if (onError) onError('delete', err);
      }
    },
    [filterOptions, onAfterChange, onError, selectedFilter, setAdvancedFilterState, setFilterOptions, setSelectedFilter, setShowAdvancedFilter]
  );

  /**
   * Direct delete action (call after confirmation)
   */
  const deleteFilter = useCallback(
    async () => {
      try {
        const filterOptionsCopy = _.cloneDeep(filterOptions);
        const newFilterOptions = filterOptionsCopy.filter(
          (o: FilterOption) => o.name !== selectedFilter?.name
        );

        setFilterOptions(newFilterOptions);
        setSelectedFilter(null);
        setShowAdvancedFilter(false);
        setAdvancedFilterState(null);

        if (onAfterChange) onAfterChange();
      } catch (err) {
        if (onError) onError('delete', err);
      }
    },
    [filterOptions, onAfterChange, onError, selectedFilter, setAdvancedFilterState, setFilterOptions, setSelectedFilter, setShowAdvancedFilter]
  );

  return {
    selectedFilterType,
    onFilterNameCreated,
    onFilterDeleteConfirmation,
    deleteFilter,
  } as const;
}

