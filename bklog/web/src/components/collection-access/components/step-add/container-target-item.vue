<!--
  - Tencent is pleased to support the open source community by making BK-LOG 蓝鲸日志平台 available.
  - Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
  - BK-LOG 蓝鲸日志平台 is licensed under the MIT License.
  -
  - License for BK-LOG 蓝鲸日志平台:
  - -------------------------------------------------------------------
  -
  - Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  - documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  - the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
  - and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  - The above copyright notice and this permission notice shall be included in all copies or substantial
  - portions of the Software.
  -
  - THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
  - LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  - NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  - WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  - SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
  -->

<template>
  <div class="load-container">
    <div class="flex-space-item">
      <div class="space-item-label">{{ $t('应用类型') }}</div>
      <bk-select
        ref="typeSelectRef"
        v-model="formData.workload_type"
        searchable
        clearable
        allow-create
        @toggle="closeTitle"
      >
        <bk-option
          v-for="(option, index) in typeList"
          :id="option.id"
          :key="index"
          class="space-type-select"
          :name="option.name"
        >
        </bk-option>
      </bk-select>
    </div>
    <div class="flex-space-item">
      <div class="space-item-label">{{ $t('应用名称') }}</div>
      <bk-select
        ref="loadSelectRef"
        v-model="formData.workload_name"
        :class="{ application: formData.workload_name, 'no-click': nameCannotClick }"
        allow-create
        searchable
        :placeholder="placeHolderStr"
        @toggle="status => (isOptionOpen = status)"
      >
        <bk-option
          v-for="(option, index) in nameList"
          :id="option.id"
          :key="`${option.name}_${index}`"
          :name="option.name"
        >
        </bk-option>
      </bk-select>
      <span :class="['bk-icon', 'icon-angle-down', isOptionOpen && 'angle-rotate']"></span>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    conItem: {
      type: Object,
      require: true
    },
    container: {
      type: Object,
      require: true
    },
    typeList: {
      type: Array,
      default: () => []
    },
    bcsClusterId: {
      type: String,
      require: true
    }
  },
  data() {
    return {
      formData: {
        workload_type: '',
        workload_name: '',
        container_name: ''
      },
      timer: null,
      isOptionOpen: false, // 是否展开了应用的下拉列表
      nameCannotClick: false, // 应用列表是否正在请求中
      nameList: [],
      placeHolderStr: `${this.$t('请输入应用名称')}, ${this.$t('支持正则匹配')}`
    };
  },
  computed: {
    ...mapGetters({
      bkBizId: 'bkBizId'
    }),
    typeListIDStrList() {
      return this.typeList.map(item => item.id);
    }
  },
  watch: {
    'formData.workload_type'(val) {
      !!val ? this.getWorkLoadNameList() : (this.nameList = []);
    },
    'conItem.noQuestParams.namespaceStr': {
      immediate: true,
      handler(str) {
        if (str) {
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.getWorkLoadNameList();
          }, 1000);
        }
      }
    },
    formData: {
      handler(val) {
        this.$emit('update:container', val);
      },
      deep: true
    },
    nameCannotClick(val) {
      const inputDOM = this.$refs.loadSelectRef.$refs.createInput;
      // input禁用样式
      val ? inputDOM.setAttribute('disabled', 'disabled') : inputDOM.removeAttribute('disabled');
    }
  },
  created() {
    Object.assign(this.formData, this.conItem.container);
  },
  mounted() {
    this.$refs.loadSelectRef.$refs.createInput.placeholder = this.placeHolderStr;
    this.$refs.typeSelectRef.$refs.createInput.placeholder = this.$t('请输入');
  },
  methods: {
    getWorkLoadNameList() {
      if (!this.typeListIDStrList.includes(this.formData.workload_type)) return;
      this.nameCannotClick = true;
      const query = {
        type: this.formData.workload_type,
        bk_biz_id: this.bkBizId,
        namespace: this.conItem.noQuestParams.namespaceStr,
        bcs_cluster_id: this.bcsClusterId
      };
      this.$http
        .request('container/getWorkLoadName', { query })
        .then(res => {
          if (res.code === 0) {
            this.nameList = res.data.map(item => ({ id: item, name: item }));
          }
        })
        .catch(err => {
          console.warn(err);
        })
        .finally(() => {
          this.nameCannotClick = false;
        });
    },
    closeTitle() {
      const els = document.querySelectorAll('.space-type-select>div>div');
      els.forEach(item => (item.title = ''));
    }
  }
};
</script>
<style lang="scss" scoped>
@import '@/scss/mixins/flex.scss';
/* stylelint-disable no-descending-specificity */
.load-container {
  @include flex-center;

  > :first-child {
    width: 28%;
    margin-right: 12px;
  }

  > :last-child {
    flex: 1;
  }

  .flex-space-item {
    position: relative;

    @include flex-justify(space-between);

    .bk-select,
    .bk-form-control {
      flex: 1;
    }

    .space-item-label {
      flex-shrink: 0;
    }

    :deep(.bk-form-input) {
      height: 34px;
    }
  }

  .space-item-label {
    min-width: 48px;
    padding: 0 6px;
    font-size: 12px;
    color: #63656e;
    background: #fafbfd;
    border: 1px solid #c4c6cc;
    border-radius: 2px 0 0 2px;
    transform: translateX(1px);

    @include flex-center;
  }
}

.application:hover + .icon-angle-down {
  display: none;
}

.icon-angle-down {
  position: absolute;
  top: 6px;
  right: 4px;
  font-size: 21px;
  color: #979ba5;
  transition: transform 0.3s;
}

.angle-rotate {
  transform: rotateZ(-180deg);
}

.no-click {
  pointer-events: none;
}
</style>
