import { Logger, Type } from '@nestjs/common';
import { Context } from '@rekog/mcp-nest';
import { ModuleRef } from '@nestjs/core';
import { AppModule } from '../app.module';

const logger = new Logger('McpGuardDecorator');

// 전역 변수로 ModuleRef 인스턴스를 저장
let moduleRefInstance: ModuleRef | null = null;

// 가드 클래스나 속성 이름을 받을 수 있는 타입
type GuardType = Type<any> | string;

/**
 * 이 데코레이터는 메서드 실행 전에 인증 로직을 수행합니다.
 * 
 * @param guards 가드 클래스 또는 주입된 가드의 속성 이름
 * @returns 메서드 데코레이터
 */
export function McpGuard(...guards: GuardType[]) {
  if (guards.length === 0) {
    guards = ['authGuard']; // 기본값
  }
  
  logger.log(`McpGuard 데코레이터가 생성되었습니다. guards: ${guards.map(g => typeof g === 'string' ? g : g.name).join(', ')}`);
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    logger.log(`McpGuard 데코레이터가 ${propertyKey} 메서드에 적용되었습니다.`);
    
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const context: Context = args[1]; // Tool 메서드의 두 번째 파라미터는 Context
      
      // ModuleRef 인스턴스를 클래스에서 가져오기 시도
      if (!moduleRefInstance && (this as any).moduleRef) {
        moduleRefInstance = (this as any).moduleRef;
        logger.log('ModuleRef 인스턴스를 클래스 속성에서 가져왔습니다.');
      }
      
      // 모든 가드에 대해 검사
      for (const guardItem of guards) {
        let guard: any;
        
        if (typeof guardItem === 'string') {
          // 속성 이름으로 가드 접근
          guard = (this as any)[guardItem];
          
          if (!guard || typeof guard.canActivate !== 'function') {
            logger.error(`${guardItem} 속성이 없거나 canActivate 메서드가 없습니다. 이 가드를 건너뜁니다.`);
            continue;
          }
        } else {
          // 가드 클래스를 의존성 주입 컨테이너에서 가져오기 시도
          try {
            // 1. 먼저 ModuleRef를 통해 가져오기 시도
            if (moduleRefInstance) {
              try {
                guard = moduleRefInstance.get(guardItem, { strict: false });
                logger.log(`가드 ${guardItem.name}를 ModuleRef를 통해 가져왔습니다.`);
              } catch (moduleRefError: any) {
                logger.error(`ModuleRef에서 가드를 가져오지 못했습니다: ${moduleRefError.message}`);
              }
            }
            
            // 2. AppModule에서 ModuleRef 가져오기 시도 (ModuleRef가 없는 경우)
            if (!guard) {
              logger.warn(`직접 인스턴스화를 통해 가드 ${guardItem.name}를 생성합니다. 주입된 의존성을 사용할 수 없을 수 있습니다.`);
              guard = new guardItem();
            }
          } catch (error: any) {
            logger.error(`가드 클래스 ${guardItem.name}를 인스턴스화하는 데 실패했습니다: ${error.message}`);
            continue;
          }
        }
        
        const guardName = typeof guardItem === 'string' ? guardItem : guardItem.name;
        logger.log(`[McpGuard] 메서드 ${propertyKey}에 대해 ${guardName}.canActivate 실행`);
        
        try {
          // 가드의 canActivate 메서드 호출
          const isAuthorized = await guard.canActivate(context);
          
          if (!isAuthorized) {
            logger.warn(`[McpGuard] 인증 실패: ${propertyKey} (가드: ${guardName})`);
            return {
              content: [{ 
                type: 'text', 
                text: `인증 실패: ${propertyKey} 접근이 거부되었습니다.` 
              }],
              unauthorized: true
            };
          }
        } catch (error: any) {
          logger.error(`가드 ${guardName}의 canActivate 실행 중 오류 발생: ${error.message}`);
          return {
            content: [{ 
              type: 'text', 
              text: `인증 과정에서 오류가 발생했습니다: ${error.message}` 
            }],
            error: error.message
          };
        }
      }
      
      // 모든 가드를 통과한 경우
      logger.log(`[McpGuard] 인증 성공: ${propertyKey}`);
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}